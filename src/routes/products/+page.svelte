<script>
    import { onMount } from 'svelte';

    let products = [];
    let loading = true;
    let error = null;

    // Form data for new product
    let newProduct = {
        name: '',
        product_code: '',
        price: ''
    };

    onMount(async () => {
        try {
            const response = await fetch('/api/products');
            if (!response.ok) {
                throw new Error('Failed to fetch products');
            }
            products = await response.json();
        } catch (err) {
            error = err.message;
        } finally {
            loading = false;
        }
    });

    async function handleSubmit() {
        try {
            const response = await fetch('/api/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newProduct)
            });

            if (!response.ok) {
                throw new Error('Failed to create product');
            }

            const result = await response.json();

            // Add the new product to the list
            products = [...products, { ...newProduct, _id: result.insertedId }];

            // Reset the form
            newProduct = {
                name: '',
                product_code: '',
                price: ''
            };
        } catch (err) {
            error = err.message;
        }
    }

    async function deleteProduct(id) {
        if (!confirm('Are you sure you want to delete this product?')) {
            return;
        }

        try {
            const response = await fetch(`/api/products/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to delete product');
            }

            // Remove the product from the list
            products = products.filter(product => product._id !== id);
        } catch (err) {
            error = err.message;
        }
    }
</script>

<div class="max-w-5xl mx-auto p-8 bg-white shadow rounded space-y-6">
    <h1 class="text-3xl font-bold mb-6">Products</h1>

    {#if error}
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
        </div>
    {/if}

    <!-- Add Product Form -->
    <div class="bg-gray-50 p-4 rounded border mb-6">
        <h2 class="text-xl font-semibold mb-4">Add New Product</h2>
        <form on:submit|preventDefault={handleSubmit} class="space-y-4">
            <div class="grid grid-cols-3 gap-4">
                <div>
                    <label for="name" class="block font-medium">Name</label>
                    <input 
                        id="name"
                        type="text" 
                        bind:value={newProduct.name} 
                        required
                        class="mt-1 w-full rounded border-gray-300" 
                    />
                </div>
                <div>
                    <label for="product_code" class="block font-medium">Product Code</label>
                    <input 
                        id="product_code"
                        type="text" 
                        bind:value={newProduct.product_code} 
                        required
                        class="mt-1 w-full rounded border-gray-300" 
                    />
                </div>
                <div>
                    <label for="price" class="block font-medium">Price</label>
                    <input 
                        id="price"
                        type="number" 
                        bind:value={newProduct.price}
                        required
                        class="mt-1 w-full rounded border-gray-300" 
                    />
                </div>
            </div>
            <button 
                type="submit" 
                class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
                Add Product
            </button>
        </form>
    </div>
<hr/>
    <!-- Products List -->
    {#if loading}
        <p>Loading products...</p>
    {:else if products.length === 0}
        <p>No products found. Add your first product above.</p>
    {:else}
        <div class="overflow-x-auto mt-10">
            <table class="min-w-full bg-white border border-gray-300">
                <thead class="bg-gray-100">
                    <tr>
                        <th class="py-2 px-4 text-left border border-gray-300">Name</th>
                        <th class="py-2 px-4 text-left border border-gray-300">Product Code</th>
                        <th class="py-2 px-4 text-left border border-gray-300">Price</th>
                        <th class="py-2 px-4 text-left border border-gray-300">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {#each products as product}
                        <tr>
                            <td class="py-2 px-4 border border-gray-300">{product.name}</td>
                            <td class="py-2 px-4 border border-gray-300">{product.product_code}</td>
                            <td class="py-2 px-4 border border-gray-300">{product.price}</td>
                            <td class="py-2 px-4 border border-gray-300">
                                <button 
                                    on:click={() => deleteProduct(product._id)}
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
