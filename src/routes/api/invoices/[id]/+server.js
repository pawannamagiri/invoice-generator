import { json } from '@sveltejs/kit';
import { getInvoiceById } from '$lib/server/invoices.js';

export async function GET({ params }) {
    try {
        const id = params.id;
        const invoice = await getInvoiceById(id);
        
        if (!invoice) {
            return json({ error: 'Invoice not found' }, { status: 404 });
        }
        
        return json(invoice);
    } catch (error) {
        console.error('Error fetching invoice:', error);
        return json({ error: 'Failed to fetch invoice' }, { status: 500 });
    }
}