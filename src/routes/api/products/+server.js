import { json } from '@sveltejs/kit';
import { getProducts, createProduct } from '$lib/server/products.js';

export async function GET() {
    try {
        const products = await getProducts();
        return json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        return json({ error: 'Failed to fetch products' }, { status: 500 });
    }
}

export async function POST({ request }) {
    try {
        const productData = await request.json();
        const result = await createProduct(productData);
        return json(result, { status: 201 });
    } catch (error) {
        console.error('Error creating product:', error);
        return json({ error: 'Failed to create product' }, { status: 500 });
    }
}