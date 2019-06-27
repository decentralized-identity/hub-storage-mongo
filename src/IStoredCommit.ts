/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ICommitProtectedHeaders } from '@decentralized-identity/hub-common-js';

/**
 * Interface defining a document stored in MongoDB which holds a single commit.
 */
export default interface IStoredCommit {

  /** Type of stored document */
  kind: 'commit';

  /** Commit ID (revision) */
  rev: string;

  /** Object ID */
  object_id: string;

  /** Owner DID */
  owner: string;

  /** Metadata fields extracted from JWT for indexing/querying */
  fields: ICommitProtectedHeaders;

  /** Original signed/encrypted commit as JSON-serialized JWS/JWE */
  commit: any;

}
