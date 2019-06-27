/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { FilterQuery, ObjectID } from 'mongodb';
import { Commit, CommitDeserializer, Store } from '@decentralized-identity/hub-node-core';
import { mapMongoError, stringifyError } from '../MongoErrorHandlers';
import IMongoWrapper from '../IMongoWrapper';
import IStoredCommit from '../IStoredCommit';

const MAX_RESULTS_PER_PAGE = 100;

/**
 * Queries the store for commits matching the specified filters.
 *
 * @param request A request specifying the details of which commits to query. This query must
 * specify at least an owner DID, may also specify other constraints.
 *
 * @returns A promise for a response containing details of the matching commits, as well as other
 * metadata such as pagination.
 */
export default async function queryCommits (mongoWrapper: IMongoWrapper, request: Store.CommitQueryRequest): Promise<Store.CommitQueryResponse> {

  // Map of filter fields: the key is the string `field` value passed by the client, and the value
  // is the path to the MongoDB field which should be queried.
  const filterFieldMap: {[key: string]: string} = {
    interface: 'fields.interface',
    context: 'fields.context',
    type: 'fields.type',
    object_id: 'object_id',
    rev: 'rev',
  };

  const query: FilterQuery<IStoredCommit> = {
    kind: 'commit',
    owner: request.owner,
  };

  (request.filters || []).forEach((filter) => {
    const mappedFieldName: string | undefined = filterFieldMap[filter.field];
    if (!mappedFieldName) throw new Error(`Unsupported filter field '${filter.field}'.`);
    if (filter.type !== 'eq') throw new Error(`Unsupported filter type '${filter.type}'.`);

    if (typeof filter.value === 'string') {
      (query as any)[mappedFieldName] = filter.value;
    } else if (Array.isArray(filter.value)) {
      (query as any)[mappedFieldName] = { $in: filter.value };
    } else {
      throw new Error(`Unsupported filter value type '${typeof filter.value}' for '${filter.field}'.`);
    }
  });

  if (request.skip_token) {
    const skipToken = request.skip_token;
    (query as any)['_id'] = { $gt: new ObjectID(skipToken) };
  }

  console.log(`Querying commits: ${JSON.stringify(query)}`);

  const cursor = mongoWrapper.getCommitCollection().find(query).sort({ _id: 1 }).limit(MAX_RESULTS_PER_PAGE);

  let results: IStoredCommit[];

  try {
    results = await cursor.toArray();
  } catch (e) {
    console.error(`Error querying commits from MongoDB: ${stringifyError(e)}`);
    throw mapMongoError(e);
  }

  const commits: Commit[] = [];
  for (const item of results) {
    commits.push(await CommitDeserializer.deserialize(item.commit));
  }

  const ids = results.map(result => `  ${(result as any)._id} ${result.rev.substr(0, 16)}`);
  console.log(`Found ${results.length} matching commits: [\n${ids.join('\n')}\n]`);

  let skipToken: string | null = null;
  if (results.length === MAX_RESULTS_PER_PAGE) {
    skipToken = (results[results.length - 1] as any)._id.toString();
  }

  console.log(`Skip token is: '${skipToken}'`);

  return {
    results: commits,
    pagination: {
      skip_token: skipToken,
    },
  };
}
