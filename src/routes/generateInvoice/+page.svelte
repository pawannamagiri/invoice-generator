<script>
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { browser } from '$app/environment';

    // Import html2pdf only in browser environment
    let html2pdf;
    if (browser) {
        import('html2pdf.js').then(module => {
            html2pdf = module.default;
        });
    }

    // Modal state
    let showModal = false;
    let searchType = 'phone';
    let searchValue = '';
    let searchError = null;
    let searchLoading = false;

    let addedProducts = [];

    // Product code search
    let productCode = '';
    let productError = null;
    let productLoading = false;

    const bank = {
            name: 'AXIS BANK',
            accountNo: '921020050654441',
            ifsc: 'UTIB0002744',
            branch: 'HYDERNAGAR(V)'
    };

    // Function to generate a sequential invoice number
    // If increment is true, it will increment the sequence and return the new number
    // Otherwise, it will just return the current number without incrementing
    async function generateInvoiceNumber(increment = false) {
        const date = new Date();
        const currentYear = date.getFullYear();

        try {
            // Get the invoice sequence from meta_data
            const response = await fetch('/api/meta_data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ increment: increment })
            });

            if (!response.ok) {
                console.log(response)
                throw new Error('Failed to get invoice sequence');
            }

            const data = await response.json();
            const sequence = data.last_invoice_sequence+1;

            // Format: INV-YYYY-NNNN where NNNN is the sequential number padded to 4 digits
            return `INV-${currentYear}-${sequence.toString().padStart(4, '0')}`;
        } catch (error) {
            console.error('Error generating invoice number:', error);
            // Fallback to a timestamp-based number in case of error
            return `INV-${currentYear}-ERR-${Date.now().toString().substr(-4)}`;
        }
    }

    // Function to get current date in YYYY-MM-DD format for the date input
    function getCurrentDate() {
        const date = new Date();
        return date.toISOString().split('T')[0];
    }

    let invoice = {
        invoiceNo: '',  // Will be set by generateInvoiceNumber
        invoiceDate: getCurrentDate(),
        reverseCharge: 'No',
        state: 'TELANGANA',
        billTo: {
            name: '',
            address: '',
            gstin: '',
            state: ''
        },
        items: [

        ],
        cgst: 0,
        sgst: 0,
        totalAfterTax: 0,
        created_at: new Date()
    };

    $: {
        // Update amount for each item when rate or qty changes
        invoice.items = invoice.items.map(item => ({
            ...item,
            amount: (item.rate || 0) * (item.qty || 0)
        }));
        invoice.sgst = invoice.items.reduce((sum, item) => sum + (item.amount || 0) * 0.09, 0);
        invoice.cgst = invoice.items.reduce((sum, item) => sum + (item.amount || 0) * 0.09, 0);
        invoice.totalAfterTax = invoice.items.reduce((sum, item) => sum + (item.amount || 0), 0)+ invoice.cgst + invoice.sgst;
    }


    let customers = [];
    let selectedCustomerId = '';
    let loading = false;
    let error = null;
    let viewOnly = false;

    // Function to load an existing invoice by ID
    async function loadInvoice(id) {
        try {
            loading = true;
            viewOnly = true; // Set view-only mode when loading an existing invoice

            const response = await fetch(`/api/invoices/${id}`);
            if (!response.ok) {
                throw new Error('Failed to fetch invoice');
            }

            const loadedInvoice = await response.json();
            invoice = loadedInvoice;

            // Find the customer in the dropdown and select it if possible
            if (invoice.billTo && customers.length > 0) {
                const customer = customers.find(c => 
                    c.name === invoice.billTo.name || 
                    c.party_name === invoice.billTo.name
                );
                if (customer) {
                    selectedCustomerId = customer._id;
                }
            }
        } catch (err) {
            error = err.message;
            console.error('Error loading invoice:', err);
        } finally {
            loading = false;
        }
    }

    onMount(async () => {
        try {
            loading = true;

            // Fetch customers
            const customersResponse = await fetch('/api/customers');
            if (!customersResponse.ok) {
                throw new Error('Failed to fetch customers');
            }
            customers = await customersResponse.json();

            // Check if we have an invoice ID in the URL
            const url = new URL(window.location.href);
            const invoiceId = url.searchParams.get('id');

            if (invoiceId) {
                // Load existing invoice
                await loadInvoice(invoiceId);
            } else {
                // Generate initial invoice number for new invoice
                invoice.invoiceNo = await generateInvoiceNumber(false);
            }

        } catch (err) {
            error = err.message;
            console.error('Error in onMount:', err);
        } finally {
            loading = false;
        }
    });

    function selectCustomer(event) {
        const customerId = event.target.value;
        selectedCustomerId = customerId;

        if (!customerId) {
            // Reset bill to party if no customer is selected
            invoice.billTo = {
                name: '',
                address: '',
                gstin: '',
                state: ''
            };
            return;
        }

        const selectedCustomer = customers.find(c => c._id === customerId);
        if (selectedCustomer) {
            invoice.billTo = {
                name: selectedCustomer.name || selectedCustomer.party_name || '',
                address: selectedCustomer.address || '',
                gstin: selectedCustomer.gstin || '',
                state: selectedCustomer.state || ''
            };
        }
    }

    function addItem() {
        invoice.items = [...invoice.items, {
            name: '',
            hsn: '',
            qty: 0,
            rate: 0,
            amount: 0
        }];
    }

    // Function to open the modal
    function openImportModal() {
        showModal = true;
        searchValue = '';
        searchError = null;
    }

    // Function to close the modal
    function closeImportModal() {
        showModal = false;
    }

    // Function to generate PDF from the invoice
    async function generatePDF() {
        // Check if we're in a browser environment
        if (!browser) {
            console.warn('PDF generation is only available in browser environment');
            return;
        }

        // Wait for html2pdf to be loaded if it's not already
        if (!html2pdf) {
            try {
                const module = await import('html2pdf.js');
                html2pdf = module.default;
            } catch (error) {
                console.error('Failed to load html2pdf.js:', error);
                alert('Failed to generate PDF: Could not load the PDF generation library');
                return;
            }
        }

        try {
            // Get the invoice element
            const invoiceElement = document.querySelector('.max-w-5xl');

            // Clone the element to avoid modifying the original
            const clonedInvoice = invoiceElement.cloneNode(true);

            // Remove buttons and other elements not needed in the PDF
            const buttonsToRemove = clonedInvoice.querySelectorAll('button');
            buttonsToRemove.forEach(button => button.remove());

            // Add styles to help with page breaks, especially for tables
            const style = document.createElement('style');
            style.textContent = `
                /* Improve table handling across page breaks */
                table { page-break-inside: auto; }
                tr { page-break-inside: avoid; page-break-after: auto; }
                td, th { page-break-inside: avoid; }
                thead { display: table-header-group; }
                tfoot { display: table-footer-group; }

                /* Add a bit more spacing between elements to prevent crowding */
                div, p, h1, h2, h3, h4, h5, h6 { page-break-inside: avoid; margin-bottom: 5px; }
            `;
            clonedInvoice.appendChild(style);

            // Set options for the PDF
            const options = {
                margin: [15, 10, 15, 10], // top, right, bottom, left margins
                filename: `invoice-${invoice.invoiceNo}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { 
                    scale: 2,
                    letterRendering: true,
                    useCORS: true
                },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
                pagebreak: { 
                    mode: ['avoid-all', 'css', 'legacy'],
                    before: '.page-break-before',
                    after: '.page-break-after',
                    avoid: '.page-break-avoid'
                }
            };

            // Add a small delay to ensure all content is fully rendered
            await new Promise(resolve => setTimeout(resolve, 500));

            // Generate the PDF with special handling for overflow content
            await html2pdf()
                .from(clonedInvoice)
                .set(options)
                .toPdf()
                .get('pdf')
                .then((pdf) => {
                    // Ensure proper handling of overflow content
                    pdf.setDisplayMode('fullwidth');
                    return pdf;
                })
                .save();
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Failed to generate PDF: ' + error.message);
        }
    }

    // Function to save the invoice
    async function saveInvoice() {
        try {
            // Ensure created_at is set
            if (!invoice.created_at) {
                invoice.created_at = new Date();
            }

            // Increment the invoice sequence for the next invoice
            // This is the only place where we increment the sequence
            await generateInvoiceNumber(true);

            // Send the invoice data to the API endpoint
            const response = await fetch('/api/invoices', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(invoice)
            });

            if (!response.ok) {
                throw new Error('Failed to save invoice');
            }

            const savedInvoice = await response.json();
            console.log('Invoice saved successfully:', savedInvoice);

            alert('Invoice saved successfully!');

            // Generate PDF after successful save
            await generatePDF();

            // Reset the form to create a new invoice
            await resetForm();
        } catch (error) {
            console.error('Error saving invoice:', error);
            alert('Failed to save invoice: ' + error.message);
        }
    }

    // Function to reset the form and create a new invoice
    async function resetForm() {
        if (confirm('Are you sure you want to reset the form? All unsaved changes will be lost.')) {
            try {
                const newInvoiceNo = await generateInvoiceNumber(false);

                invoice = {
                    invoiceNo: newInvoiceNo,
                    invoiceDate: getCurrentDate(),
                    reverseCharge: 'No',
                    state: 'TELANGANA',
                    billTo: {
                        name: '',
                        address: '',
                        gstin: '',
                        state: ''
                    },
                    items: [],
                    cgst: 0,
                    sgst: 0,
                    totalAfterTax: 0,
                    created_at: new Date()
                };
                selectedCustomerId = '';
            } catch (error) {
                console.error('Error resetting form:', error);
                alert('Failed to generate a new invoice number. Please try again.');
            }
        }
    }

    // Function to search for a customer by phone or GSTIN
    async function searchCustomer() {
        if (!searchValue.trim()) {
            searchError = 'Please enter a value to search';
            return;
        }

        searchError = null;
        searchLoading = true;

        try {
            const response = await fetch(`/api/customers/search?value=${searchValue}&type=${searchType}`);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to search for customer');
            }

            const customer = await response.json();

            // Populate the form fields with the customer data
            invoice.billTo = {
                name: customer.name || customer.party_name || '',
                address: customer.address || '',
                gstin: customer.gstin || '',
                state: customer.state || ''
            };

            // Find the customer in the dropdown and select it if possible
            const customerIndex = customers.findIndex(c => c._id === customer._id);
            if (customerIndex >= 0) {
                selectedCustomerId = customer._id;
            } else {
                selectedCustomerId = '';
            }

            // Close the modal
            closeImportModal();
        } catch (error) {
            console.error('Error searching for customer:', error);
            searchError = error.message || 'Failed to search for customer';
        } finally {
            searchLoading = false;
        }
    }

    // Function to search for a product by product code and add it to the invoice
    async function searchProduct() {
        if (!productCode.trim()) {
            productError = 'Please enter a product code';
            return;
        }

        productError = null;
        productLoading = true;

        try {
            const response = await fetch(`/api/products/code?code=${productCode}`);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to search for product');
            }

            const product = await response.json();

            // Add the product to the invoice items
            invoice.items = [...invoice.items, {
                name: product.name,
                hsn: '',
                qty: 1,
                rate: product.price,
                amount: product.price
            }];

            console.log(invoice.items);
            // Reset the product code
            productCode = '';
        } catch (error) {
            console.error('Error searching for product:', error);
            productError = error.message || 'Failed to search for product';
        } finally {
            productLoading = false;
        }
    }
</script>

<svelte:head>
    <title>{viewOnly ? `View Invoice ${invoice.invoiceNo}` : 'Generate New Invoice'} | Invoice Generator</title>
</svelte:head>

<div class="max-w-5xl mx-auto p-8 bg-white shadow rounded space-y-6">
    <!-- Page Title -->
    {#if viewOnly}
        <div class="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-4" role="alert">
            <p class="font-bold">View Mode</p>
            <p>You are viewing an existing invoice. Fields are read-only.</p>
        </div>
    {/if}

    <!-- Import Button -->
    <div class="flex justify-end mb-4">
        {#if !viewOnly}
            <button 
                type="button" 
                on:click={openImportModal} 
                class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
                Import
            </button>
        {/if}
    </div>

    <!-- Header -->
    <div class="text-center border-b pb-4">
        <h1 class="text-3xl font-bold uppercase">KAKATIYA PRINTING INKS</h1>
        <p class="text-sm">Plot #250, Flat #301, Sardarpatel Nagar, KPHB, Hyderabad - 500085</p>
        <p class="text-sm">Ph: +91 7306993345 | Email: kvenkateswaraa65@gmail.com</p>
        <p class="text-sm">GST No: 36AUZPK5272H1ZY</p>
    </div>

    <!-- Invoice Details -->
    <div class="grid grid-cols-4 gap-4 text-sm">
        <div>
            <label class="block font-medium">Invoice No</label>
            <div class="flex">
                <input type="text" bind:value={invoice.invoiceNo} class="mt-1 w-full rounded-l border-gray-300 bg-gray-100" readonly />
                <button 
                    type="button" 
                    on:click={async () => {
                        try {
                            invoice.invoiceNo = await generateInvoiceNumber(false);
                        } catch (error) {
                            console.error('Error generating invoice number:', error);
                            alert('Failed to generate a new invoice number. Please try again.');
                        }
                    }} 
                    class="mt-1 bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded-r text-sm"
                    title="Generate new invoice number"
                >
                    ↻
                </button>
            </div>
        </div>
        <div>
            <label class="block font-medium">Invoice Date</label>
            <input type="date" bind:value={invoice.invoiceDate} class="mt-1 w-full rounded border-gray-300" disabled={viewOnly} />
        </div>
        <div>
            <label class="block font-medium">Reverse Charge (Y/N)</label>
<!--            <input type="text" bind:value={invoice.reverseCharge} class="mt-1 w-full rounded border-gray-300" />-->

            <select bind:value={invoice.reverseCharge} class="mt-1 w-full rounded border-gray-300" disabled={viewOnly}>
                <option value="Yes">Yes</option>
                <option value="No" selected={true}>No</option>
            </select>
        </div>
        <div>
            <label class="block font-medium">State</label>
            <input type="text" bind:value={invoice.state} class="mt-1 w-full rounded border-gray-300" disabled={viewOnly} />
        </div>
    </div>

    <!-- Bill to Party -->
    <div class="pt-4 border-t">
        <h2 class="text-xl font-semibold mb-2">Bill to Party</h2>

        {#if error}
            <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
            </div>
        {/if}

        <!-- Customer Selection -->
        <div class="mb-4">
            <label for="customer-select" class="block font-medium text-sm">Select Customer</label>
            <select 
                id="customer-select"
                on:change={selectCustomer}
                bind:value={selectedCustomerId}
                class="mt-1 w-full rounded border-gray-300"
                disabled={loading || viewOnly}
            >
                <option value="">-- Select a customer --</option>
                {#each customers as customer}
                    <option value={customer._id}>{customer.name || customer.party_name}</option>
                {/each}
            </select>
            {#if loading}
                <p class="text-sm text-gray-500 mt-1">Loading customers...</p>
            {/if}
        </div>

        <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
                <label class="block font-medium">Name</label>
                <input type="text" bind:value={invoice.billTo.name} class="mt-1 w-full rounded border-gray-300" disabled={viewOnly} />
            </div>
            <div>
                <label class="block font-medium">GSTIN</label>
                <input type="text" bind:value={invoice.billTo.gstin} class="mt-1 w-full rounded border-gray-300" disabled={viewOnly} />
            </div>
            <div class="col-span-2">
                <label class="block font-medium">Address</label>
                <textarea bind:value={invoice.billTo.address} rows="2" class="mt-1 w-full rounded border-gray-300" disabled={viewOnly}></textarea>
            </div>
            <div>
                <label class="block font-medium">State</label>
                <input type="text" bind:value={invoice.billTo.state} class="mt-1 w-full rounded border-gray-300" disabled={viewOnly} />
            </div>
        </div>
    </div>

    <!-- Items Table -->
    <div class="pt-4 border-t">
        <h2 class="text-xl font-semibold mb-2">Items</h2>

        {#if !viewOnly}
            <!-- Add Product by Code -->
            <div class="bg-gray-50 p-4 rounded border mb-4">
                <h3 class="text-lg font-medium mb-2">Add Product by Code</h3>
                <div class="flex items-end space-x-2">
                    <div class="flex-grow">
                        <label for="product-code" class="block font-medium text-sm mb-1">Product Code</label>
                        <input 
                            id="product-code"
                            type="text" 
                            bind:value={productCode} 
                            placeholder="Enter product code" 
                            class="w-full rounded border-gray-300 p-2 border"
                        />
                    </div>
                    <button 
                        type="button" 
                        on:click={searchProduct} 
                        class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        disabled={productLoading}
                    >
                        {productLoading ? 'Adding...' : 'Add Product'}
                    </button>
                </div>
                {#if productError}
                    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-2">
                        {productError}
                    </div>
                {/if}
            </div>

            <!-- Add Empty Item Button -->
            <div class="mb-4 flex justify-end">
                <button 
                    type="button" 
                    on:click={addItem} 
                    class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    Add Empty Item
                </button>
            </div>
        {/if}

        <div class="space-y-2">
            {#each invoice.items as item}
                <div class="grid grid-cols-6 gap-2 text-sm">
                    <div>
                        <label class="block font-medium">Name</label>
                        <input type="text" bind:value={item.name} class="mt-1 w-full rounded border-gray-300" disabled={viewOnly} />
                    </div>
                    <div>
                        <label class="block font-medium">HSN Code</label>
                        <input type="text" bind:value={item.hsn} class="mt-1 w-full rounded border-gray-300" disabled={viewOnly} />
                    </div>
                    <div>
                        <label class="block font-medium">Qty</label>
                        <input type="number" bind:value={item.qty} class="mt-1 w-full rounded border-gray-300" disabled={viewOnly} />
                    </div>
                    <div>
                        <label class="block font-medium">Rate</label>
                        <input type="number" bind:value={item.rate} class="mt-1 w-full rounded border-gray-300" disabled={viewOnly} />
                    </div>
                    <div>
                        <label class="block font-medium">Amount</label>
                        <input type="number" bind:value={item.amount} class="mt-1 w-full rounded border-gray-300" disabled={viewOnly} />
                    </div>
                </div>
            {/each}

        </div>
    </div>

    <!-- Tax and Totals -->
    <div class="grid grid-cols-3 gap-4 border-t pt-4 text-sm">
        <div>
            <label class="block font-medium">CGST(9%)</label>
            <input type="number" bind:value={invoice.cgst} class="mt-1 w-full rounded border-gray-300" disabled={viewOnly} />
        </div>
        <div>
            <label class="block font-medium">SGST(9%)</label>
            <input type="number" bind:value={invoice.sgst} class="mt-1 w-full rounded border-gray-300" disabled={viewOnly} />
        </div>
        <div>
            <label class="block font-medium">Total After Tax</label>
            <input type="number" bind:value={invoice.totalAfterTax} class="mt-1 w-full rounded border-gray-300 bg-green-300" disabled/>
        </div>
    </div>

    <!-- Bank Details -->
    <div class="border-t pt-4 text-sm">
        <h2 class="text-xl font-semibold mb-2">Bank Details</h2>
        <div class="grid grid-cols-2 gap-4">
            <div>
                <label class="block font-medium">Bank Name</label>
                <input type="text" value={bank.name} class="mt-1 w-full rounded border-gray-300" disabled={viewOnly} />
            </div>
            <div>
                <label class="block font-medium">Account No</label>
                <input type="text" value={bank.accountNo} class="mt-1 w-full rounded border-gray-300" disabled={viewOnly} />
            </div>
            <div>
                <label class="block font-medium">IFSC Code</label>
                <input type="text" value={bank.ifsc} class="mt-1 w-full rounded border-gray-300" disabled={viewOnly} />
            </div>
            <div>
                <label class="block font-medium">Branch</label>
                <input type="text" value={bank.branch} class="mt-1 w-full rounded border-gray-300" disabled={viewOnly} />
            </div>
        </div>
    </div>

    <!-- Signature -->
    <div class="flex justify-between border-t pt-6">
        <div class="flex space-x-2">
            {#if viewOnly}
                <button 
                    type="button" 
                    on:click={() => goto('/invoices')} 
                    class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-medium"
                >
                    Back to Invoices
                </button>
                <button 
                    type="button" 
                    on:click={generatePDF} 
                    class="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded font-medium"
                >
                    Download PDF
                </button>
                <button 
                    type="button" 
                    on:click={() => {
                        viewOnly = false;
                        // Generate a new invoice number for the copy
                        generateInvoiceNumber(false).then(newNumber => {
                            // Create a copy of the invoice without the _id field
                            const { _id, ...invoiceWithoutId } = invoice;
                            // Update the invoice with the copy (without _id) and new invoice number
                            invoice = {
                                ...invoiceWithoutId,
                                invoiceNo: newNumber,
                                created_at: new Date() // Set a new creation date
                            };
                        });
                    }} 
                    class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-medium"
                >
                    Create Copy
                </button>
            {:else}
                <button 
                    type="button" 
                    on:click={saveInvoice} 
                    class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-medium"
                >
                    Save Invoice
                </button>
                <button 
                    type="button" 
                    on:click={resetForm} 
                    class="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded font-medium"
                >
                    New Invoice
                </button>
            {/if}
        </div>
        <div class="text-right">
            <p class="font-medium">For KAKATIYA PRINTING INKS</p>
            <p class="italic text-sm">Authorized Signature</p>
        </div>
    </div>
</div>

<!-- Import Modal -->
{#if showModal}
<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 class="text-xl font-semibold mb-4">Import Customer Details</h2>

        <!-- Search Type Selection -->
        <div class="mb-4">
            <div class="flex items-center space-x-4">
                <label class="inline-flex items-center">
                    <input type="radio" bind:group={searchType} value="phone" class="form-radio">
                    <span class="ml-2">Phone</span>
                </label>
                <label class="inline-flex items-center">
                    <input type="radio" bind:group={searchType} value="gstin" class="form-radio">
                    <span class="ml-2">GSTIN</span>
                </label>
            </div>
        </div>

        <!-- Search Input -->
        <div class="mb-4">
            <label class="block font-medium text-sm mb-1">
                {searchType === 'phone' ? 'Phone Number' : 'GSTIN'}
            </label>
            <input 
                type="text" 
                bind:value={searchValue} 
                placeholder={searchType === 'phone' ? 'Enter phone number' : 'Enter GSTIN'} 
                class="w-full rounded border-gray-300 p-2 border"
            />
        </div>

        <!-- Error Message -->
        {#if searchError}
            <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {searchError}
            </div>
        {/if}

        <!-- Buttons -->
        <div class="flex justify-end space-x-2">
            <button 
                type="button" 
                on:click={closeImportModal} 
                class="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100"
            >
                Cancel
            </button>
            <button 
                type="button" 
                on:click={searchCustomer} 
                class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                disabled={searchLoading}
            >
                {searchLoading ? 'Searching...' : 'Submit'}
            </button>
        </div>
    </div>
</div>
{/if}
