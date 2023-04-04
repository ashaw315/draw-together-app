export {};
import { MongoClient, GridFSBucket } from 'mongodb';

const uri = process.env.MONGODB_URI!;
const client = await MongoClient.connect(uri);

const dbName = 'mydb';
const database = client.db(dbName);

const bucket = new GridFSBucket(database);

export {client, database, bucket};
