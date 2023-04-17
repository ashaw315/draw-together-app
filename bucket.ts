const mongoDB = require('mongodb');
import { database } from './database';

const bucket = new mongoDB.GridFSBucket(database);

export { bucket };