/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Collection } from 'mongodb';
import IStoredCommit from './IStoredCommit';
import IStoredObject from './IStoredObject';

/**
 * Interface defining the calls which will be made to the MongoDB database layer.
 *
 * This interface allows the MongoDB connection to be mocked in unit tests.
 */
export default interface IMongoWrapper {

  /**
   * Connects to the MongoDB instance.
   */
  connect (): Promise<void>;

  /**
   * Returns a reference to the MongoDB collection holding Hub commit details.
   */
  getCommitCollection (): Collection<IStoredCommit>;

  /**
   * Returns a reference to the MongoDB collection holding Hub object metadata.
   */
  getObjectCollection (): Collection<IStoredObject>;

}
