import clientPromise from './db.js';
import { ObjectId } from 'mongodb';

export async function getInvoices() {
    const client = await clientPromise;
    const db = client.db('invoice-management');
    return await db.collection('invoices').find({}).toArray();
}

export async function getInvoiceById(id) {
    const client = await clientPromise;
    const db = client.db('invoice-management');
    return await db.collection('invoices').findOne({ _id: new ObjectId(id) });
}

export async function createInvoice(invoiceData) {
    const client = await clientPromise;
    const db = client.db('invoice-management');

    // Add created_at timestamp if not provided
    if (!invoiceData.created_at) {
        invoiceData.created_at = new Date();
    }

    // Ensure we don't try to use an existing _id
    const { _id, ...dataWithoutId } = invoiceData;

    const result = await db.collection('invoices').insertOne(dataWithoutId);
    return { ...dataWithoutId, _id: result.insertedId };
}

export async function deleteInvoice(id) {
    const client = await clientPromise;
    const db = client.db('invoice-management');
    const result = await db.collection('invoices').deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount === 1;
}
