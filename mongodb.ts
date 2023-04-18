import { client, database } from './database';
import { bucket } from './bucket';

if(!process.env.MONGODB_URI) {
    throw new Error('PLease add mongo db uri')
}

export { client, database, bucket };