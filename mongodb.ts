import { client, database } from './database';
import { bucket } from './bucket';

if(!process.env.MONGODB_URI) {
    throw new Error('Please add MongoDB URI')
}

export { client, database, bucket };