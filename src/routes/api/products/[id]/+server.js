import { json } from '@sveltejs/kit';
import { getProductById, updateProduct, deleteProduct } from '$lib/server/products.js';

export async function GET({ params }) {
    try {
        const product = await getProductById(params.id);
        if (!product) {
            return json({ error: 'Product not found' }, { status: 404 });
        }
        return json(product);
    } catch (error) {
        console.error('Error fetching product:', error);
        return json({ error: 'Failed to fetch product' }, { status: 500 });
    }
}

export async function PUT({ params, request }) {
    try {
        const productData = await request.json();
        const result = await updateProduct(params.id, productData);
        if (result.matchedCount === 0) {
            return json({ error: 'Product not found' }, { status: 404 });
        }
        return json({ success: true });
    } catch (error) {
        console.error('Error updating product:', error);
        return json({ error: 'Failed to update product' }, { status: 500 });
    }
}

export async function DELETE({ params }) {
    try {
        const result = await deleteProduct(params.id);
        if (result.deletedCount === 0) {
            return json({ error: 'Product not found' }, { status: 404 });
        }
        return json({ success: true });
    } catch (error) {
        console.error('Error deleting product:', error);
        return json({ error: 'Failed to delete product' }, { status: 500 });
    }
}