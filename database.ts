const mongoDB = require('mongodb');

const uri = process.env.MONGODB_URI!;
const client = await mongoDB.MongoClient.connect(uri);

const dbName = 'mydb';
const database = client.db(dbName);

export { client, database };