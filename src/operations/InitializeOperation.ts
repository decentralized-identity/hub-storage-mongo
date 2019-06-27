/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Collection } from 'mongodb';
import IMongoDBOptions from '../IMongoDBOptions';
import IMongoWrapper from '../IMongoWrapper';

/**
 * Handles initializing the MongoDB database.
 *
 * @param mongoWrapper The MongoDB implementation to use.
 */
export default async function initialize (mongoWrapper: IMongoWrapper, options: IMongoDBOptions): Promise<void> {
  await mongoWrapper.connect();

  createUniqueIndex(mongoWrapper.getCommitCollection(), 'rev');
  createUniqueIndex(mongoWrapper.getObjectCollection(), 'object_id');
}

async function createUniqueIndex (collection: Collection, indexedField: string) {
  return collection.createIndex({
    [indexedField]: 1,
  },                            {
    unique: true,
  });
}
