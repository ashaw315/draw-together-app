// import { MongoClient } from "mongodb";
// import * as mongoDB from "mongodb";
const mongoDB = require('mongodb');

const uri = process.env.MONGODB_URI!;
const client = await mongoDB.MongoClient.connect(uri);

const dbName = 'mydb';
const database = client.db(dbName);

export { client, database };

// const uri = process.env.MONGODB_URI!;
// const options = {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// };

// const client = new MongoClient(uri, options);

// client.connect((err) => {
//   if (err) {
//     console.error(`MongoDB connection failed: ${err}`);
//     return;
//   }
//   console.log('Connected to MongoDB');
// });

// const database = client.db('mydb');

// export { client, database };