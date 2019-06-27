/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { MongoClient, Collection } from 'mongodb';
import IMongoDBOptions from './IMongoDBOptions';
import IStoredCommit from './IStoredCommit';
import IStoredObject from './IStoredObject';
import IMongoWrapper from './IMongoWrapper';

/* istanbul ignore next */

/**
 * Production implementation of `IMongoWrapper` which connects to MongoDB.
 */
export default class MongoWrapper implements IMongoWrapper {

  private client: MongoClient | undefined;
  private options: IMongoDBOptions;

  constructor (options: IMongoDBOptions) {
    this.options = options;
  }

  /**
   * Connects to the MongoDB instance.
   */
  async connect (): Promise<void> {
    this.client = await MongoClient.connect(this.options.url, this.options.clientOptions);
  }

  /**
   * Returns a reference to the MongoDB collection holding Hub commit details.
   */
  getCommitCollection (): Collection<IStoredCommit> {
    if (!this.client) throw new Error('Mongo client not yet created.');
    return this.client.db(this.options.databaseId).collection(this.options.commitCollectionId);
  }

  /**
   * Returns a reference to the MongoDB collection holding Hub object metadata.
   */
  getObjectCollection (): Collection<IStoredObject> {
    if (!this.client) throw new Error('Mongo client not yet created.');
    return this.client.db(this.options.databaseId).collection(this.options.objectCollectionId);
  }

}
