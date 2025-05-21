<script>
    import { onMount } from 'svelte';

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

    let invoice = {
        invoiceNo: '',
        invoiceDate: '',
        reverseCharge: 'N',
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
        bank: {
            name: 'AXIS BANK',
            accountNo: '921020050654441',
            ifsc: 'UTIB0002744',
            branch: 'HYDERNAGAR(V)'
        }
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

    onMount(async () => {
        try {
            loading = true;
            const response = await fetch('/api/customers');
            if (!response.ok) {
                throw new Error('Failed to fetch customers');
            }
            customers = await response.json();
        } catch (err) {
            error = err.message;
            console.error('Error fetching customers:', err);
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
        invoice.items.push({ particulars: '', hsn: '', qty: '', rate: '', amount: '' });
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

<div class="max-w-5xl mx-auto p-8 bg-white shadow rounded space-y-6">
    <!-- Import Button -->
    <div class="flex justify-end mb-4">
        <button 
            type="button" 
            on:click={openImportModal} 
            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
            Import
        </button>
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
            <input type="text" bind:value={invoice.invoiceNo} class="mt-1 w-full rounded border-gray-300" />
        </div>
        <div>
            <label class="block font-medium">Invoice Date</label>
            <input type="date" bind:value={invoice.invoiceDate} class="mt-1 w-full rounded border-gray-300" />
        </div>
        <div>
            <label class="block font-medium">Reverse Charge (Y/N)</label>
            <input type="text" bind:value={invoice.reverseCharge} class="mt-1 w-full rounded border-gray-300" />
        </div>
        <div>
            <label class="block font-medium">State</label>
            <input type="text" bind:value={invoice.state} class="mt-1 w-full rounded border-gray-300" />
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
                disabled={loading}
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
                <input type="text" bind:value={invoice.billTo.name} class="mt-1 w-full rounded border-gray-300" />
            </div>
            <div>
                <label class="block font-medium">GSTIN</label>
                <input type="text" bind:value={invoice.billTo.gstin} class="mt-1 w-full rounded border-gray-300" />
            </div>
            <div class="col-span-2">
                <label class="block font-medium">Address</label>
                <textarea bind:value={invoice.billTo.address} rows="2" class="mt-1 w-full rounded border-gray-300"></textarea>
            </div>
            <div>
                <label class="block font-medium">State</label>
                <input type="text" bind:value={invoice.billTo.state} class="mt-1 w-full rounded border-gray-300" />
            </div>
        </div>
    </div>

    <!-- Items Table -->
    <div class="pt-4 border-t">
        <h2 class="text-xl font-semibold mb-2">Items</h2>

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

        <div class="space-y-2">
            {#each invoice.items as item}
                <div class="grid grid-cols-6 gap-2 text-sm">
                    <div>
                        <label class="block font-medium">Name</label>
                        <input type="text" bind:value={item.name} class="mt-1 w-full rounded border-gray-300" />
                    </div>
                    <div>
                        <label class="block font-medium">HSN Code</label>
                        <input type="text" bind:value={item.hsn} class="mt-1 w-full rounded border-gray-300" />
                    </div>
                    <div>
                        <label class="block font-medium">Qty</label>
                        <input type="number" bind:value={item.qty} class="mt-1 w-full rounded border-gray-300" />
                    </div>
                    <div>
                        <label class="block font-medium">Rate</label>
                        <input type="number" bind:value={item.rate} class="mt-1 w-full rounded border-gray-300" />
                    </div>
                    <div>
                        <label class="block font-medium">Amount</label>
                        <input type="number" bind:value={item.amount} class="mt-1 w-full rounded border-gray-300" />
                    </div>
                </div>
            {/each}

        </div>
    </div>

    <!-- Tax and Totals -->
    <div class="grid grid-cols-3 gap-4 border-t pt-4 text-sm">
        <div>
            <label class="block font-medium">CGST(9%)</label>
            <input type="number" bind:value={invoice.cgst} class="mt-1 w-full rounded border-gray-300" />
        </div>
        <div>
            <label class="block font-medium">SGST(9%)</label>
            <input type="number" bind:value={invoice.sgst} class="mt-1 w-full rounded border-gray-300" />
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
                <input type="text" bind:value={invoice.bank.name} class="mt-1 w-full rounded border-gray-300" />
            </div>
            <div>
                <label class="block font-medium">Account No</label>
                <input type="text" bind:value={invoice.bank.accountNo} class="mt-1 w-full rounded border-gray-300" />
            </div>
            <div>
                <label class="block font-medium">IFSC Code</label>
                <input type="text" bind:value={invoice.bank.ifsc} class="mt-1 w-full rounded border-gray-300" />
            </div>
            <div>
                <label class="block font-medium">Branch</label>
                <input type="text" bind:value={invoice.bank.branch} class="mt-1 w-full rounded border-gray-300" />
            </div>
        </div>
    </div>

    <!-- Signature -->
    <div class="flex justify-end border-t pt-6">
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
