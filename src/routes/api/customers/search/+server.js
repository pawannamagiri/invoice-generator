import { json } from '@sveltejs/kit';
import { getCustomerByPhoneOrGstin } from '$lib/server/customers.js';

export async function GET({ url }) {
    try {
        const value = url.searchParams.get('value');
        const type = url.searchParams.get('type');
        
        if (!value || !type) {
            return json({ error: 'Missing required parameters: value and type' }, { status: 400 });
        }
        
        if (type !== 'phone' && type !== 'gstin') {
            return json({ error: 'Type must be either "phone" or "gstin"' }, { status: 400 });
        }
        
        const customer = await getCustomerByPhoneOrGstin(value, type);
        
        if (!customer) {
            return json({ error: 'Customer not found' }, { status: 404 });
        }
        
        return json(customer);
    } catch (error) {
        console.error('Error searching for customer:', error);
        return json({ error: 'Failed to search for customer' }, { status: 500 });
    }
}