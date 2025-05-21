import { json } from '@sveltejs/kit';
import { getProductByCode } from '$lib/server/products.js';

export async function GET({ url }) {
    try {
        const code = url.searchParams.get('code');
        
        if (!code) {
            return json({ error: 'Product code is required' }, { status: 400 });
        }
        
        const product = await getProductByCode(code);
        
        if (!product) {
            return json({ error: 'Product not found' }, { status: 404 });
        }
        
        return json(product);
    } catch (error) {
        console.error('Error fetching product by code:', error);
        return json({ error: 'Failed to fetch product' }, { status: 500 });
    }
}