/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as yup from 'yup';
import IStoredCommit from './IStoredCommit';
import IStoredObject from './IStoredObject';
import { HubError, HubErrorCode } from '@decentralized-identity/hub-node-core';

const lowercaseHexRegex = /^[a-f0-9]+$/;
const base64UrlRegex = /^[A-z0-9\-_]+$/;
const didRegex = /^did:[a-z0-9]+(:[a-zA-Z0-9.-]+)+$/;
const didWithFragmentRegex = /^did:[a-z0-9]+(:[a-zA-Z0-9.-]+)+#.+$/;
const isoDateRegex = /^([0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])T(2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9])(.[0-9]+)?(Z)?$/;

const matchesRegex = (regex: RegExp) => {
  return yup.string().matches(regex, { excludeEmptyString: true }).required();
};

const isLowercaseHexString = matchesRegex(lowercaseHexRegex);
const isBase64UrlString = matchesRegex(base64UrlRegex);
const isDid = matchesRegex(didRegex);
const isDidWithFragment = matchesRegex(didWithFragmentRegex);

/**
 * Schema for validating stored commits.
 */
const storedCommitSchema = yup.object().shape({
  kind: yup.string().oneOf(['commit']).required(),
  rev: isLowercaseHexString,
  object_id: isLowercaseHexString,
  owner: isDid,
  fields: yup.object().shape({
    interface: yup.string().oneOf(['Profile', 'Permissions', 'Actions', 'Collections', 'Stores']).required(),
    context: yup.string().required(),
    type: yup.string().required(),
    operation: yup.string().oneOf(['create', 'update', 'delete']).required(),
    committed_at: matchesRegex(isoDateRegex),
    commit_strategy: yup.string().required(),
    iss: isDid,
    sub: isDid,
    kid: isDidWithFragment,
  }).required().noUnknown(),
  commit: yup.object().shape({
    protected: isBase64UrlString,
    header: yup.object(),
    payload: yup.string(),
    signature: isBase64UrlString,
  }).required().noUnknown(),
}).noUnknown();

/**
 * Validates stored commit data.
 *
 * @param object A document representing a stored commit.
 */
async function validateCommit (commit: IStoredCommit) {
  try {
    await storedCommitSchema.validate(commit, {
      strict: true,
    });

    if (commit.owner !== commit.fields.sub) {
      throw new HubError({
        errorCode: HubErrorCode.BadRequest,
        developerMessage: "The 'owner' and 'fields.sub' fields must match.",
      });
    }

    if (commit.fields.operation === 'create' && commit.object_id !== commit.rev) {
      throw new HubError({
        errorCode: HubErrorCode.BadRequest,
        developerMessage: "The 'object_id' and 'fields.rev' fields must match for a 'create' commit.",
      });
    }
  } catch (e) {
    if (e.name === 'ValidationError') {
      throw new HubError({
        errorCode: HubErrorCode.BadRequest,
        property: e.path ? `commit.${e.path}` : 'commit',
      });
    } else {
      throw new HubError({
        errorCode: HubErrorCode.ServerError,
        developerMessage: 'Error validating commit data.',
      });
    }
  }
}

/**
 * Schema for validating object cache data.
 */
const storedObjectSchema = yup.object().shape({
  kind: yup.string().oneOf(['object']).required(),
  object_id: isLowercaseHexString,
  owner: isDid,
  fields: yup.object().shape({
    interface: yup.string().oneOf(['Profile', 'Permissions', 'Actions', 'Collections', 'Stores']).required(),
    context: yup.string().required(),
    type: yup.string().required(),
    id: isLowercaseHexString,
    created_at: matchesRegex(isoDateRegex),
    created_by: isDid,
    commit_strategy: yup.string().required(),
    sub: isDid,
  }).required().noUnknown(),
}).noUnknown();

/**
 * Validates stored object data.
 *
 * @param object A document representing a stored object.
 */
async function validateObject (object: IStoredObject) {
  try {
    await storedObjectSchema.validate(object, {
      strict: true,
    });

    if (object.owner !== object.fields.sub) {
      throw new HubError({
        errorCode: HubErrorCode.BadRequest,
        developerMessage: "The object 'owner' and 'fields.sub' fields must match.",
      });
    }

    if (object.object_id !== object.fields.id) {
      throw new HubError({
        errorCode: HubErrorCode.BadRequest,
        developerMessage: "The object 'object_id' and 'fields.id' fields must match.",
      });
    }
  } catch (e) {
    if (e.name === 'ValidationError') {
      throw new HubError({
        errorCode: HubErrorCode.BadRequest,
        property: e.path ? `object.${e.path}` : 'object',
      });
    } else {
      throw new HubError({
        errorCode: HubErrorCode.ServerError,
        developerMessage: 'Error validating object data.',
      });
    }
  }
}

export default {
  validateCommit,
  validateObject,
};
