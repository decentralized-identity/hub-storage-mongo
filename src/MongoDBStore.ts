/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Store } from '@decentralized-identity/hub-node-core';
import IMongoDBOptions from './IMongoDBOptions';
import MongoWrapper from './MongoWrapper';
import InitializeOperation from './operations/InitializeOperation';
import CommitOperation from './operations/CommitOperation';
import QueryCommitsOperation from './operations/QueryCommitsOperation';
import QueryObjectsOperation from './operations/QueryObjectsOperation';

/* istanbul ignore next */

/**
 * Identity Hub Store plugin for MongoDB
 */
export class MongoDBStore implements Store.Store {

  /** Production MongoWrapper which will call the real database. */
  protected mongoWrapper: MongoWrapper;

  constructor (private options: IMongoDBOptions) {
    this.mongoWrapper = new MongoWrapper(options);
  }

  /**
   * Performs any necesssary initialization steps.
   */
  async initialize (): Promise<void> {
    return InitializeOperation(this.mongoWrapper, this.options);
  }

  /**
   * Adds a Commit object to the store. This method is idempotent and it is acceptable to pass a
   * previously seen Commit.
   */
  async commit (request: Store.CommitRequest): Promise<Store.CommitResponse> {
    return CommitOperation(this.mongoWrapper, request);
  }

  /**
   * Queries the store for objects matching the specified filters.
   *
   * @param request A request specifying the details of which objects to query. This query must
   * specify at least an owner DID, may also specify other constraints.
   *
   * @returns A promise for a response containing details of the matching objects, as well as other
   * metadata such as pagination.
   */
  async queryObjects (request: Store.ObjectQueryRequest): Promise<Store.ObjectQueryResponse> {
    return QueryObjectsOperation(this.mongoWrapper, request);
  }

  /**
   * Queries the store for commits matching the specified filters.
   *
   * @param request A request specifying the details of which commits to query. This query must
   * specify at least an owner DID, may also specify other constraints.
   *
   * @returns A promise for a response containing details of the matching commits, as well as other
   * metadata such as pagination.
   */
  async queryCommits (request: Store.CommitQueryRequest): Promise<Store.CommitQueryResponse> {
    return QueryCommitsOperation(this.mongoWrapper, request);
  }

}
