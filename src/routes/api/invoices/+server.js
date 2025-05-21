import { json } from '@sveltejs/kit';
import { getInvoices, createInvoice } from '$lib/server/invoices.js';

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