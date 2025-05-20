import { json } from '@sveltejs/kit';
import { getCustomers, createCustomer } from '$lib/server/customers.js';

export async function GET() {
    try {
        const customers = await getCustomers();
        return json(customers);
    } catch (error) {
        console.error('Error fetching customers:', error);
        return json({ error: 'Failed to fetch customers' }, { status: 500 });
    }
}

export async function POST({ request }) {
    try {
        const customerData = await request.json();
        const result = await createCustomer(customerData);
        return json(result, { status: 201 });
    } catch (error) {
        console.error('Error creating customer:', error);
        return json({ error: 'Failed to create customer' }, { status: 500 });
    }
}