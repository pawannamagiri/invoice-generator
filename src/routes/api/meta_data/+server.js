import { json } from '@sveltejs/kit';
import { getMetaData, getNextInvoiceSequence, getCurrentInvoiceSequence } from '$lib/server/meta_data.js';

export async function GET() {
    try {
        const metaData = await getMetaData();
        return json(metaData);
    } catch (error) {
        console.error('Error fetching meta data:', error);
        return json({ error: 'Failed to fetch meta data' }, { status: 500 });
    }
}

export async function POST({ request }) {
    try {
        // Check if we should increment the sequence or just get the current value
        let requestData = {};
        try {
            requestData = await request.json();
        } catch (e) {
            // If no JSON body is provided, assume default behavior
            requestData = {};
        }

        const increment = requestData.increment === true;

        if (increment) {
            // Increment and get the next sequence
            const nextSequence = await getNextInvoiceSequence();
            return json({ last_invoice_sequence: nextSequence });
        } else {
            // Just get the current sequence without incrementing
            const currentSequence = await getCurrentInvoiceSequence();
            return json({ last_invoice_sequence: currentSequence });
        }
    } catch (error) {
        console.error('Error with invoice sequence:', error);
        return json({ error: 'Failed to process invoice sequence request' }, { status: 500 });
    }
}
