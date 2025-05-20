import { json } from '@sveltejs/kit';
import { getCustomerById, updateCustomer, deleteCustomer } from '$lib/server/customers.js';

export async function GET({ params }) {
    try {
        const customer = await getCustomerById(params.id);
        if (!customer) {
            return json({ error: 'Customer not found' }, { status: 404 });
        }
        return json(customer);
    } catch (error) {
        console.error('Error fetching customer:', error);
        return json({ error: 'Failed to fetch customer' }, { status: 500 });
    }
}

export async function PUT({ params, request }) {
    try {
        const customerData = await request.json();
        const result = await updateCustomer(params.id, customerData);
        if (result.matchedCount === 0) {
            return json({ error: 'Customer not found' }, { status: 404 });
        }
        return json({ success: true });
    } catch (error) {
        console.error('Error updating customer:', error);
        return json({ error: 'Failed to update customer' }, { status: 500 });
    }
}

export async function DELETE({ params }) {
    try {
        const result = await deleteCustomer(params.id);
        if (result.deletedCount === 0) {
            return json({ error: 'Customer not found' }, { status: 404 });
        }
        return json({ success: true });
    } catch (error) {
        console.error('Error deleting customer:', error);
        return json({ error: 'Failed to delete customer' }, { status: 500 });
    }
}