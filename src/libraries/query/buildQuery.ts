/* eslint-disable security/detect-object-injection */

import { PipelineStage } from 'mongoose';

// utils/query/buildQuery.ts
export type QueryParams = Record<string, any>;

const operatorsMap: Record<string, string> = {
  gte: '$gte',
  lte: '$lte',
  gt: '$gt',
  lt: '$lt',
  ne: '$ne',
  in: '$in',
  nin: '$nin',
};

// eslint-disable-next-line sonarjs/cognitive-complexity
function buildFilter(query: QueryParams): Record<string, any> {
  const filter: Record<string, any> = {};

  for (const key in query) {
    if (['search', 'sort', 'page', 'limit'].includes(key)) continue;

    if (typeof query[key] === 'object') {
      for (const op in query[key]) {
        const mongoOp = operatorsMap[op];
        if (mongoOp) {
          // eslint-disable-next-line max-depth
          if (!filter[key]) filter[key] = {};
          filter[key][mongoOp] = parseValue(query[key][op]);
        }
      }
    } else {
      filter[key] = parseValue(query[key]);
    }
  }

  return filter;
}

function buildSearch(query: QueryParams, fields: string[] = []): Record<string, any> {
  if (!query.search || fields.length === 0) return {};
  // eslint-disable-next-line security/detect-non-literal-regexp
  const regex = new RegExp(query.search, 'i');
  return { $or: fields.map(f => ({ [f]: regex })) };
}

function buildSort(sortQuery?: string): Record<string, 1 | -1> {
  if (!sortQuery) return { createdAt: -1 };
  const sort: Record<string, 1 | -1> = {};
  sortQuery.split(',').forEach(field => {
    sort[field.startsWith('-') ? field.slice(1) : field] = field.startsWith('-') ? -1 : 1;
  });
  return sort;
}

function buildPagination(query: QueryParams): Record<string, number> {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Number(query.limit) || 20, 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

function parseValue(val: any): any {
  if (Array.isArray(val)) return val.map(parseValue);

  // Convert numbers
  if (!isNaN(val) && val !== '') return Number(val);

  // Convert booleans
  if (val === 'true') return true;
  if (val === 'false') return false;

  // Convert ISO date strings
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(val)) {
    return new Date(val);
  }

  return val;
}

export function buildQuery(
  query: QueryParams,
  searchFields: string[] = []
): {
  filter: Record<string, any>;
  sort: Record<string, 1 | -1>;
  pagination: Record<string, number>;
  pipeline: PipelineStage[];
} {
  const filter = { ...buildFilter(query), ...buildSearch(query, searchFields) };
  const sort = buildSort(query.sort);
  const pagination = buildPagination(query);

  const pipeline = [
    { $match: filter },
    { $sort: sort },
    {
      $facet: {
        items: [{ $skip: pagination.skip }, { $limit: pagination.limit }],
        totalCount: [{ $count: 'count' }],
      },
    },
  ];

  return { filter, sort, pagination, pipeline };
}
