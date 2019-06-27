/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { HubError, HubErrorCode } from '@decentralized-identity/hub-node-core';

/**
 * Maps an error thrown by the MongoDB SDK to an appropriate `HubError`.
 *
 * @param error An error thrown by the MongoDB SDK.
 */
export function mapMongoError (_: any) {
  throw new HubError({
    errorCode: HubErrorCode.ServerError,
    developerMessage: 'An internal storage error occurred.',
  });
}

/**
 * Returns true if the given error represents a uniqueness constraint violation which can be safely
 * ignored.
 *
 * @param error An error thrown by the MongoDB SDK.
 */
export function isConflictError (error: any) {
  return error.code === 11000 || error.code === 11001;
}

/**
 * Returns a JSON string description of the given error.
 *
 * @param error The error to describe.
 */
export function stringifyError (error: any) {
  return JSON.stringify(error, Object.getOwnPropertyNames(error));
}
