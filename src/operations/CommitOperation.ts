/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Commit, Store } from '@decentralized-identity/hub-node-core';
import { isConflictError, mapMongoError, stringifyError } from '../MongoErrorHandlers';
import IMongoWrapper from '../IMongoWrapper';
import IStoredCommit from '../IStoredCommit';
import Validator from '../Validator';
import IStoredObject from '../IStoredObject';
import { InsertOneWriteOpResult } from 'mongodb';

/**
 * Handles adding a new commit to MongoDB.
 *
 * @param mongoWrapper The MongoDB implementation to use.
 * @param request The commit request.
 */
export default async function commit (mongoWrapper: IMongoWrapper, request: Store.CommitRequest): Promise<Store.CommitResponse> {

  const headers = request.commit.getHeaders();

  const storedCommit: IStoredCommit = {
    kind: 'commit',
    rev: headers.rev!,
    owner: headers.sub,
    object_id: headers.object_id!,
    fields: {
      interface: headers.interface,
      context: headers.context,
      type: headers.type,
      operation: headers.operation,
      committed_at: headers.committed_at,
      commit_strategy: headers.commit_strategy,
      iss: headers.iss,
      sub: headers.sub,
      kid: headers.kid,
    },
    commit: request.commit.toJson(),
  };

  try {
    await Validator.validateCommit(storedCommit);
  } catch (e) {
    console.error(`Error validating new commit: ${stringifyError(e)}`);
    throw e;
  }

  let result: InsertOneWriteOpResult | null = null;

  try {
    console.log(`Attempting to store commit '${storedCommit.rev}'`);
    result = await mongoWrapper.getCommitCollection().insertOne(storedCommit, { forceServerObjectId: true });
  } catch (e) {
    if (isConflictError(e)) {
      // Uniqueness constraint; indicates we have already stored this commit.
      console.log(`Commit '${storedCommit.rev}' already exists, treating as success. Mongo error: ${e.message}`);
    } else {
      console.error(`Error storing commit in Mongo: ${stringifyError(e)}`);
      throw mapMongoError(e);
    }
  }

  if (result) console.log(`Stored commit '${storedCommit.rev}' as MongoDB document '${result.insertedId}'.`);

  if (storedCommit.fields.operation === 'create') {
    // Add object cache entry
    await addObjectCache(mongoWrapper, request.owner, request.commit);
  }

  const knownRevisions: string[] = await getKnownRevisions(mongoWrapper, headers.sub, headers.object_id!);

  return {
    knownRevisions,
  };
}

/**
 * Given a commit that creates a new object, adds an entry for the object in the object cache
 * collection, to allow efficient queries over the objects in a Hub.
 *
 * @param ownerDid The fully-qualified DID owning the Hub where the commit was created.
 * @param commit A Commit with operation 'create' that provides the metadata for the object.
 */
async function addObjectCache (mongoWrapper: IMongoWrapper, ownerDid: string, commit: Commit) {

  const headers = commit.getHeaders();

  const storedObject: IStoredObject = {
    kind: 'object',
    object_id: commit.getHeaders().rev!,
    owner: ownerDid,
    fields: {
      interface: headers.interface,
      context: headers.context,
      type: headers.type,
      id: headers.rev!,
      sub: headers.sub,
      created_at: headers.committed_at,
      created_by: commit.getHeaders().iss,
      commit_strategy: headers.commit_strategy,
    },
  };

  await Validator.validateObject(storedObject);

  let result: InsertOneWriteOpResult | null = null;

  try {
    console.log(`Attempting to add cache entry for object '${storedObject.object_id}'`);
    result = await mongoWrapper.getObjectCollection().insertOne(storedObject, { forceServerObjectId: true });

    console.log(result);
  } catch (e) {
    if (isConflictError(e)) {
      // Uniqueness constraint; indicates we have already stored this commit.
      console.log(`Object entry for '${storedObject.object_id}' already exists, treating as success. Mongo error: ${e.message}`);
    } else {
      console.error(`Error storing object cache in Mongo: ${stringifyError(e)}`);
      throw mapMongoError(e);
    }
  }

  if (result) console.log(`Stored cache for object '${storedObject.object_id}' as MongoDB document '${result.insertedId}'.`);
}

/**
 * Returns all the known revisions for a particular object.
 *
 * @param ownerDid The fully-qualified DID which owns the Hub containing the object.
 * @param objectId The object ID to find revisions for.
 * @returns An array of strings containing all known revisions.
 */
async function getKnownRevisions (mongoWrapper: IMongoWrapper, ownerDid: string, objectId: string): Promise<string[]> {
  try {
    const cursor = mongoWrapper.getCommitCollection().find({
      owner: ownerDid,
      object_id: objectId,
    },                                                     {
      projection: {
        rev: true,
      },
    });

    const results = await cursor.toArray();
    const revisions = results.map(result => result.rev);

    console.log(`Found ${results.length} revision(s) for object ${objectId}: [${revisions.join(', ')}]`);

    return revisions;
  } catch (e) {
    throw mapMongoError(e);
  }
}
