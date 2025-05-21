import { json } from '@sveltejs/kit';
import { getInvoices, createInvoice, deleteInvoice } from '$lib/server/invoices.js';

export async function GET() {
    try {
        const invoices = await getInvoices();
        return json(invoices);
    } catch (error) {
        console.error('Error fetching invoices:', error);
        return json({ error: 'Failed to fetch invoices' }, { status: 500 });
    }
}

export async function POST({ request }) {
    try {
        const invoiceData = await request.json();
        const result = await createInvoice(invoiceData);
        return json(result, { status: 201 });
    } catch (error) {
        console.error('Error creating invoice:', error);
        return json({ error: 'Failed to create invoice' }, { status: 500 });
    }
}

export async function DELETE({ url }) {
    try {
        const id = url.searchParams.get('id');
        if (!id) {
            return json({ error: 'Invoice ID is required' }, { status: 400 });
        }

        const success = await deleteInvoice(id);
        if (success) {
            return json({ success: true });
        } else {
            return json({ error: 'Invoice not found' }, { status: 404 });
        }
    } catch (error) {
        console.error('Error deleting invoice:', error);
        return json({ error: 'Failed to delete invoice' }, { status: 500 });
    }
}
