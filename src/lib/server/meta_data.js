import clientPromise from './db.js';

export async function getMetaData() {
    const client = await clientPromise;
    const db = client.db('invoice-management');

    // Get the first document from meta_data collection
    // If it doesn't exist, create it with default values
    const metaData = await db.collection('meta_data').findOne({});
    console.log(metaData);
    if (!metaData) {
        const defaultMetaData = { last_invoice_sequence: 0 };
        await db.collection('meta_data').insertOne(defaultMetaData);
        return defaultMetaData;
    }

    return metaData;
}

// Helper function to extract the sequence number from the result
async function handleResult(result, db) {
    console.log('Processing result:', JSON.stringify(result, null, 2));

    // For MongoDB driver 6.x, the result should be the document itself
    if (result && result.last_invoice_sequence !== undefined) {
        console.log('Using result.last_invoice_sequence');
        return result.last_invoice_sequence;
    }

    // For older MongoDB driver versions, the result might be in result.value
    if (result && result.value && result.value.last_invoice_sequence !== undefined) {
        console.log('Using result.value.last_invoice_sequence');
        return result.value.last_invoice_sequence;
    }

    // If we can't find the sequence in the expected places, try to explore the result object
    if (result && typeof result === 'object') {
        console.log('Exploring result object. Keys:', Object.keys(result));

        // Check if the result has an ok property (indicating a MongoDB command result)
        if (result.ok === 1 && result.lastErrorObject) {
            console.log('Found MongoDB command result format');

            // Try to get the updated document from the result
            if (result.value && result.value.last_invoice_sequence !== undefined) {
                return result.value.last_invoice_sequence;
            }
        }

        // Fallback: return the first document from meta_data collection
        console.log('Fallback: getting meta_data document directly');
        const metaData = await db.collection('meta_data').findOne({});
        if (metaData && metaData.last_invoice_sequence !== undefined) {
            return metaData.last_invoice_sequence;
        }
    }

    // If we get here, we couldn't find the sequence number
    console.error('Unexpected result format:', result);
    throw new Error('Failed to extract sequence number from result');
}

// Get the current invoice sequence without incrementing it
export async function getCurrentInvoiceSequence() {
    const client = await clientPromise;
    const db = client.db('invoice-management');

    console.log('Getting current invoice sequence...');

    try {
        // Get the meta_data document
        const metaData = await db.collection('meta_data').findOne({});

        // If it doesn't exist, create it with default values
        if (!metaData) {
            const defaultMetaData = { last_invoice_sequence: 0 };
            await db.collection('meta_data').insertOne(defaultMetaData);
            return 0;
        }

        return metaData.last_invoice_sequence;
    } catch (error) {
        console.error('Error getting current invoice sequence:', error);
        return 0; // Default to 0 if there's an error
    }
}

// Increment and get the next invoice sequence
export async function getNextInvoiceSequence() {
    const client = await clientPromise;
    const db = client.db('invoice-management');

    console.log('Getting next invoice sequence...');

    // Find the meta_data document and increment the last_invoice_sequence
    // Try with both returnDocument and returnNewDocument options to support different MongoDB driver versions
    try {
        // Try with returnDocument: 'after' (MongoDB 4.2+)
        const result = await db.collection('meta_data').findOneAndUpdate(
            {}, // Filter for the first document
            { $inc: { last_invoice_sequence: 1 } }, // Increment the sequence
            { 
                returnDocument: 'after', // Return the updated document (MongoDB 4.2+)
                upsert: true // Create if it doesn't exist
            }
        );
        return await handleResult(result, db);
    } catch (error) {
        console.log('Error with returnDocument option:', error.message);

        try {
            // Try with returnOriginal: false (MongoDB 3.6+)
            const result = await db.collection('meta_data').findOneAndUpdate(
                {}, // Filter for the first document
                { $inc: { last_invoice_sequence: 1 } }, // Increment the sequence
                { 
                    returnOriginal: false, // Return the updated document (MongoDB 3.6+)
                    upsert: true // Create if it doesn't exist
                }
            );
            return await handleResult(result, db);
        } catch (error) {
            console.log('Error with returnOriginal option:', error.message);

            try {
                // Try with returnNewDocument option (older MongoDB versions)
                const result = await db.collection('meta_data').findOneAndUpdate(
                    {}, // Filter for the first document
                    { $inc: { last_invoice_sequence: 1 } }, // Increment the sequence
                    { 
                        returnNewDocument: true, // Return the updated document (older MongoDB versions)
                        upsert: true // Create if it doesn't exist
                    }
                );
                return await handleResult(result, db);
            } catch (error) {
                console.log('Error with returnNewDocument option:', error.message);

                // Last resort: use findOneAndUpdate without return options, then fetch the document
                try {
                    const result = await db.collection('meta_data').findOneAndUpdate(
                        {}, // Filter for the first document
                        { $inc: { last_invoice_sequence: 1 } }, // Increment the sequence
                        { 
                            upsert: true // Create if it doesn't exist
                        }
                    );
                    console.log('Basic findOneAndUpdate result:', JSON.stringify(result, null, 2));

                    // Get the updated document directly
                    const metaData = await db.collection('meta_data').findOne({});
                    if (metaData && metaData.last_invoice_sequence !== undefined) {
                        return metaData.last_invoice_sequence;
                    }

                    throw new Error('Failed to get next invoice sequence after multiple attempts');
                } catch (finalError) {
                    console.error('All attempts failed:', finalError.message);

                    // Ultimate fallback: create a new document and return 1
                    await db.collection('meta_data').deleteMany({}); // Clear any potentially corrupted documents
                    await db.collection('meta_data').insertOne({ last_invoice_sequence: 1 });
                    return 1;
                }
            }
        }
    }
}
