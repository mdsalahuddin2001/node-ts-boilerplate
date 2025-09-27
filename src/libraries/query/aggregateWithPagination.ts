// utils/query/aggregateWithPagination.ts
import { Model } from 'mongoose';
import { buildQuery } from './buildQuery';

interface AggregateResult<T> {
  items: T[];
  pagination: {
    totalItems: number;
    currentPage: number;
    perPage: number;
    totalPages: number;
    hasPrevPage: boolean;
    hasNextPage: boolean;
    prevPage: number | null;
    nextPage: number | null;
    startIndex: number;
    endIndex: number;
  };
}

export async function aggregateWithPagination<T>(
  model: Model<T>,
  query: Record<string, any>,
  searchFields: string[] = []
): Promise<AggregateResult<T>> {
  const { pipeline, pagination } = buildQuery(query, searchFields);

  const result = await model.aggregate(pipeline);
  const items = result[0]?.items || [];
  const totalItems = result[0]?.totalCount[0]?.count || 0;

  const totalPages = Math.ceil(totalItems / pagination.limit) || 1;
  const hasPrevPage = pagination.page > 1;
  const hasNextPage = pagination.page < totalPages;

  const startIndex = totalItems === 0 ? 0 : pagination.skip + 1;
  const endIndex = totalItems === 0 ? 0 : pagination.skip + items.length;

  return {
    items,
    pagination: {
      totalItems,
      currentPage: pagination.page,
      perPage: pagination.limit,
      totalPages,
      hasPrevPage,
      hasNextPage,
      prevPage: hasPrevPage ? pagination.page - 1 : null,
      nextPage: hasNextPage ? pagination.page + 1 : null,
      startIndex,
      endIndex,
    },
  };
}
