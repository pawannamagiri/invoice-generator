import clientPromise from './db.js';
import { ObjectId } from 'mongodb';

export async function getProducts() {
    const client = await clientPromise;
    const db = client.db('invoice-management');
    const products = await db.collection('products').find({}).toArray();
    return products;
}

export async function getProductById(id) {
    const client = await clientPromise;
    const db = client.db('invoice-management');
    return db.collection('products').findOne({ _id: new ObjectId(id) });
}

export async function getProductByCode(code) {
    const client = await clientPromise;
    const db = client.db('invoice-management');
    return db.collection('products').findOne({ product_code: code });
}

export async function createProduct(productData) {
    const client = await clientPromise;
    const db = client.db('invoice-management');
    const result = await db.collection('products').insertOne(productData);
    return result;
}

export async function updateProduct(id, productData) {
    const client = await clientPromise;
    const db = client.db('invoice-management');
    const result = await db.collection('products').updateOne(
        { _id: new ObjectId(id) },
        { $set: productData }
    );
    return result;
}

export async function deleteProduct(id) {
    const client = await clientPromise;
    const db = client.db('invoice-management');
    const result = await db.collection('products').deleteOne({ _id: new ObjectId(id) });
    return result;
}
