/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { MongoClientOptions } from 'mongodb';

/**
 * Connection options for the MongoDB driver.
 */
export default interface IMongoDBOptions {

  /** The MongoDB endpoint to connect to. */
  url: string;

  /** The identifier of the MongoDB database to connect to. */
  databaseId: string;

  /** The identifier of the collection which holds commit data. */
  commitCollectionId: string;

  /** The identifier of the collection which holds object metadata. */
  objectCollectionId: string;

  /** Additional options for the Mongo client library. */
  clientOptions?: MongoClientOptions;

}
