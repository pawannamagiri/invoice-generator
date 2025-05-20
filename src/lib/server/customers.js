import clientPromise from './db.js';
import { ObjectId } from 'mongodb';

export async function getCustomers() {
    const client = await clientPromise;
    const db = client.db('invoice-management');
    const customers = await db.collection('customers').find({}).toArray();
    return customers;
}

export async function getCustomerById(id) {
    const client = await clientPromise;
    const db = client.db('invoice-management');
    return db.collection('customers').findOne({ _id: new ObjectId(id) });
}

export async function getCustomerByPhoneOrGstin(value, type) {
    const client = await clientPromise;
    const db = client.db('invoice-management');

    // Create a query based on the type (phone or gstin)
    const query = type === 'phone' 
        ? { phone: value } 
        : { gstin: value };

    return db.collection('customers').findOne(query);
}

export async function createCustomer(customerData) {
    const client = await clientPromise;
    const db = client.db('invoice-management');
    const result = await db.collection('customers').insertOne(customerData);
    return result;
}

export async function updateCustomer(id, customerData) {
    const client = await clientPromise;
    const db = client.db('invoice-management');
    const result = await db.collection('customers').updateOne(
        { _id: new ObjectId(id) },
        { $set: customerData }
    );
    return result;
}

export async function deleteCustomer(id) {
    const client = await clientPromise;
    const db = client.db('invoice-management');
    const result = await db.collection('customers').deleteOne({ _id: new ObjectId(id) });
    return result;
}
