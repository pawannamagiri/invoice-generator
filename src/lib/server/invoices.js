import clientPromise from './db.js';

export async function getInvoices() {
    const client = await clientPromise;
    const db = client.db('invoice-management');
    return await db.collection('invoices').find({}).toArray();
}


export async function createInvoice(invoiceData) {
    const client = await clientPromise;
    const db = client.db('invoice-management');

    // Add created_at timestamp if not provided
    if (!invoiceData.created_at) {
        invoiceData.created_at = new Date();
    }

    const result = await db.collection('invoices').insertOne(invoiceData);
    return { ...invoiceData, _id: result.insertedId };
}
