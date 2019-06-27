/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { IObjectMetadata } from '@decentralized-identity/hub-node-core';

/**
 * Interface defining a document stored in MongoDB which represents the available (i.e.
 * Hub-readable) metadata of a Hub object.
 *
 * These cached documents are used when running queries over the objects in a Hub.
 */
export default interface IStoredObject {

  /** Type of stored document */
  kind: 'object';

  /** Object ID */
  object_id: string;

  /** Owner DID */
  owner: string;

  /** Details to be returned through API */
  fields: IObjectMetadata;

}
