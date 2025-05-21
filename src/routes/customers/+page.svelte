<script>
    import { onMount } from 'svelte';

    let customers = [];
    let loading = true;
    let error = null;

    // Form data for new customer
    let newCustomer = {
        name: '',
        address: '',
        gstin: '',
        phone: ''
    };

    onMount(async () => {
        try {
            const response = await fetch('/api/customers');
            if (!response.ok) {
                throw new Error('Failed to fetch customers');
            }
            customers = await response.json();
        } catch (err) {
            error = err.message;
        } finally {
            loading = false;
        }
    });

    async function handleSubmit() {
        try {
            const response = await fetch('/api/customers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newCustomer)
            });

            if (!response.ok) {
                throw new Error('Failed to create customer');
            }

            const result = await response.json();

            // Add the new customer to the list
            customers = [...customers, { ...newCustomer, _id: result.insertedId }];

            // Reset the form
            newCustomer = {
                name: '',
                address: '',
                gstin: '',
                phone: ''
            };
        } catch (err) {
            error = err.message;
        }
    }

    async function deleteCustomer(id) {
        if (!confirm('Are you sure you want to delete this customer?')) {
            return;
        }

        try {
            const response = await fetch(`/api/customers/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to delete customer');
            }

            // Remove the customer from the list
            customers = customers.filter(customer => customer._id !== id);
        } catch (err) {
            error = err.message;
        }
    }
</script>

<div class="max-w-5xl mx-auto p-8 bg-white shadow rounded space-y-6">
    <h1 class="text-3xl font-bold mb-6">Customers</h1>

    {#if error}
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
        </div>
    {/if}

    <!-- Add Customer Form -->
    <div class="bg-gray-50 p-4 rounded border mb-6">
        <h2 class="text-xl font-semibold mb-4">Add New Customer</h2>
        <form on:submit|preventDefault={handleSubmit} class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label for="name" class="block font-medium">Name</label>
                    <input 
                        id="name"
                        type="text" 
                        bind:value={newCustomer.name} 
                        required
                        class="mt-1 w-full rounded border-gray-300" 
                    />
                </div>
                <div>
                    <label for="gstin" class="block font-medium">GSTIN</label>
                    <input 
                        id="gstin"
                        type="text" 
                        bind:value={newCustomer.gstin} 
                        class="mt-1 w-full rounded border-gray-300" 
                    />
                </div>
                <div class="col-span-2">
                    <label for="address" class="block font-medium">Address</label>
                    <textarea 
                        id="address"
                        bind:value={newCustomer.address} 
                        rows="2" 
                        class="mt-1 w-full rounded border-gray-300"
                    ></textarea>
                </div>
                <div>
                    <label for="phone" class="block font-medium">Phone</label>
                    <input 
                        id="phone"
                        type="text" 
                        bind:value={newCustomer.phone}
                        class="mt-1 w-full rounded border-gray-300" 
                    />
                </div>
            </div>
            <button 
                type="submit" 
                class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
                Add Customer
            </button>
        </form>
    </div>
<hr/>
    <!-- Customers List -->
    {#if loading}
        <p>Loading customers...</p>
    {:else if customers.length === 0}
        <p>No customers found. Add your first customer above.</p>
    {:else}
        <div class="overflow-x-auto mt-10">
            <table class="min-w-full bg-white border border-gray-300">
                <thead class="bg-gray-100">
                    <tr>
                        <th class="py-2 px-4 text-left border border-gray-300">Name</th>
                        <th class="py-2 px-4 text-left border border-gray-300">GSTIN</th>
                        <th class="py-2 px-4 text-left border border-gray-300">Phone</th>
                        <th class="py-2 px-4 text-left border border-gray-300">Address</th>
                        <th class="py-2 px-4 text-left border border-gray-300">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {#each customers as customer}
                        <tr>
                            <td class="py-2 px-4 border border-gray-300">{customer.party_name}</td>
                            <td class="py-2 px-4 border border-gray-300">{customer.gstin}</td>
                            <td class="py-2 px-4 border border-gray-300">{customer.phone}</td>
                            <td class="py-2 px-4 border border-gray-300">{customer.address}</td>
                            <td class="py-2 px-4 border border-gray-300">
                                <button 
                                    on:click={() => deleteCustomer(customer._id)}
                                    class="text-red-600 hover:text-red-800"
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    {/if}
</div>
