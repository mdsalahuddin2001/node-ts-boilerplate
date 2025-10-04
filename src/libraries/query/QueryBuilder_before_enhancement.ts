/* eslint-disable security/detect-object-injection */
import { Model, PopulateOptions } from 'mongoose';

/**
 * =============================
 * Types & Interfaces
 * =============================
 */

// Enhanced type to allow simple string fields or complex Mongoose PopulateOptions objects
export type PopulateFields = string | string[] | PopulateOptions | PopulateOptions[];
export type QueryParams = Record<string, any>;

export interface QueryConfig {
  searchFields?: string[];
  sortableFields?: string[];
  selectableFields?: string[];
  filterableFields?: string[];
  defaultSort?: string;
  defaultLimit?: number;
  maxLimit?: number;
}

export type SortOptions = Record<string, 1 | -1>;

export interface PaginationOptions {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  startIndex: number;
  endIndex: number;
}

export interface PaginatedData<T> {
  items: T[];
  pagination: PaginationInfo;
}

export interface ParsedQuery {
  filter: Record<string, any>;
  sort: SortOptions;
  pagination: PaginationOptions;
  select: string[];
}

/**
 * =============================
 * Query Builder Class
 * =============================
 */

// Helper conditional type for the execute method

export class QueryBuilder {
  private config: Required<QueryConfig>;
  private queryParams: QueryParams = {};
  private model!: Model<any>;
  private populateFields: PopulateOptions[] = [];
  private isLean = false;
  private customSelect?: string;
  private isPaginated = false; // Flag for fluent execution

  constructor(config: QueryConfig = {}) {
    this.config = {
      searchFields: config.searchFields || [],
      sortableFields: config.sortableFields || [],
      selectableFields: config.selectableFields || [],
      filterableFields: config.filterableFields || [],
      defaultSort: config.defaultSort || 'createdAt',
      defaultLimit: config.defaultLimit || 20,
      maxLimit: config.maxLimit || 100,
    };
  }

  query(model: Model<any>, queryParams: QueryParams): this {
    this.model = model;
    this.queryParams = queryParams;
    // Reset state for a new query chain
    this.isPaginated = false;
    this.populateFields = [];
    this.isLean = false;
    this.customSelect = undefined;
    return this;
  }

  /**
   * Accepts field names (string or string[]) or Mongoose PopulateOptions (object or object[]).
   */
  populate(fields: PopulateFields): this {
    if (typeof fields === 'string') {
      this.populateFields.push({ path: fields });
    } else if (Array.isArray(fields)) {
      fields.forEach(field => {
        if (typeof field === 'string') {
          this.populateFields.push({ path: field });
        } else {
          this.populateFields.push(field);
        }
      });
    } else {
      this.populateFields.push(fields);
    }
    return this;
  }

  lean(useLean = true): this {
    this.isLean = useLean;
    return this;
  }

  select(fields: string): this {
    this.customSelect = fields;
    return this;
  }

  /**
   * Sets the builder state to perform a paginated execution when .execute() is called.
   */
  paginate(): this {
    this.isPaginated = true;
    return this;
  }

  /**
   * The terminal method for query execution.
   * Executes a standard find (T[]) or a paginated find (PaginatedData<T>)
   * based on whether .paginate() was called.
   * * @template T - The type of the document being queried.
   * @returns A promise resolving to T[] or PaginatedData<T>.
   */
  async execute<T = any>(): Promise<T[] | PaginatedData<T>> {
    this.validateQuery();
    const { filter, sort, pagination, select } = this.parse();

    if (this.isPaginated) {
      // Execute the paginated query
      const { items, totalCount } = await this.executeWithPagination<T>(
        filter,
        sort,
        select,
        pagination
      );

      return {
        items,
        pagination: this.buildPaginationInfo(
          pagination.page,
          pagination.limit,
          totalCount,
          pagination.skip
        ),
      } as PaginatedData<T>; // Type assertion for correct return
    } else {
      // Execute the standard find query
      let query = this.model.find(filter);

      if (this.customSelect || select.length > 0) {
        query = query.select(this.customSelect || select.join(' '));
      }

      if (this.populateFields.length > 0) {
        query = query.populate(this.populateFields);
      }

      if (this.isLean) query = query.lean();

      return (await query.sort(sort)) as T[]; // Type assertion for correct return
    }
  }

  /**
   * Returns the parsed query configuration object without executing the query.
   */
  getQuery(): ParsedQuery {
    return this.parse();
  }

  // ---------------- INTERNAL METHODS ---------------- //

  private async executeWithPagination<T>(
    filter: Record<string, any>,
    sort: SortOptions,
    select: string[],
    pagination: PaginationOptions
  ): Promise<{ items: T[]; totalCount: number }> {
    let query = this.model.find(filter);

    if (this.customSelect || select.length > 0) {
      query = query.select(this.customSelect || select.join(' '));
    }

    if (this.populateFields.length > 0) {
      query = query.populate(this.populateFields);
    }

    if (this.isLean) query = query.lean();

    const [items, totalCount] = await Promise.all([
      query.sort(sort).skip(pagination.skip).limit(pagination.limit),
      this.model.countDocuments(filter),
    ]);

    return { items, totalCount };
  }

  private parse(): ParsedQuery {
    const filter = this.buildFilter();
    const searchConditions = this.buildSearch();
    const combinedFilter = this.combineFilterAndSearch(filter, searchConditions);

    return {
      filter: combinedFilter,
      sort: this.buildSort(),
      pagination: this.buildPagination(),
      select: this.buildSelect(),
    };
  }

  // eslint-disable-next-line sonarjs/cognitive-complexity
  private buildFilter(): Record<string, any> {
    const filter: Record<string, any> = {};
    const reservedParams = ['search', 'sort', 'page', 'limit', 'select', 'populate'];

    for (const key in this.queryParams) {
      if (reservedParams.includes(key)) continue;
      // Filter out non-whitelisted fields if filterableFields is configured
      if (this.config.filterableFields.length > 0 && !this.config.filterableFields.includes(key))
        continue;

      const value = this.queryParams[key];

      if (this.isObject(value) && !Array.isArray(value)) {
        const conditions: Record<string, any> = {};
        const operatorsMap = {
          gte: '$gte',
          lte: '$lte',
          gt: '$gt',
          lt: '$lt',
          ne: '$ne',
          in: '$in',
          nin: '$nin',
          eq: '$eq',
        };

        for (const op in value) {
          const mongoOp = operatorsMap[op as keyof typeof operatorsMap];
          if (mongoOp) {
            conditions[mongoOp] = this.parseValue(value[op]);
          }
        }
        if (Object.keys(conditions).length > 0) {
          filter[key] = conditions;
        }
      } else {
        filter[key] = this.parseValue(value);
      }
    }

    return filter;
  }

  private buildSearch(): Record<string, any> {
    if (!this.queryParams.search || this.config.searchFields.length === 0) return {};
    // eslint-disable-next-line security/detect-non-literal-regexp
    const regex = new RegExp(this.queryParams.search, 'i');
    return { $or: this.config.searchFields.map(field => ({ [field]: regex })) };
  }

  private combineFilterAndSearch(
    filter: Record<string, any>,
    search: Record<string, any>
  ): Record<string, any> {
    if (!Object.keys(search).length) return filter;
    if (!Object.keys(filter).length) return search;
    return { $and: [filter, search] };
  }

  private buildSort(): SortOptions {
    const sortParam = this.queryParams.sort || this.config.defaultSort;
    const sort: SortOptions = {};

    sortParam.split(',').forEach((field: string) => {
      const trimmed = field.trim();
      if (!trimmed) return;

      const isDesc = trimmed.startsWith('-');
      const fieldName = isDesc ? trimmed.slice(1) : trimmed;

      if (this.config.sortableFields.length > 0 && !this.config.sortableFields.includes(fieldName))
        return;

      sort[fieldName] = isDesc ? -1 : 1;
    });

    return sort;
  }

  private buildPagination(): PaginationOptions {
    const page = Math.max(Number(this.queryParams.page) || 1, 1);
    const limit = Math.min(
      Math.max(Number(this.queryParams.limit) || this.config.defaultLimit, 1),
      this.config.maxLimit
    );
    const skip = (page - 1) * limit;
    return { page, limit, skip };
  }

  private buildSelect(): string[] {
    if (!this.queryParams.select) return [];
    const fields = this.queryParams.select.split(',').map((f: string) => f.trim());
    return this.config.selectableFields.length > 0
      ? fields.filter((f: string) => this.config.selectableFields.includes(f))
      : fields;
  }

  private buildPaginationInfo(
    page: number,
    limit: number,
    totalCount: number,
    skip: number
  ): PaginationInfo {
    const totalPages = Math.ceil(totalCount / limit);
    return {
      page,
      limit,
      totalCount,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      startIndex: totalCount > 0 ? skip + 1 : 0,
      endIndex: totalCount > 0 ? Math.min(skip + limit, totalCount) : 0,
    };
  }

  private parseValue(value: any): any {
    if (Array.isArray(value)) return value.map(v => this.parseValue(v));
    if (typeof value !== 'string') return value;
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (value === 'null') return null;
    if (value !== '' && !isNaN(Number(value))) return Number(value);
    if (value.includes(',')) return value.split(',').map(v => this.parseValue(v.trim()));
    return value;
  }

  private isObject(value: any): boolean {
    return value !== null && typeof value === 'object' && value.constructor === Object;
  }

  private validateQuery(): void {
    if (this.queryParams.limit && Number(this.queryParams.limit) > this.config.maxLimit) {
      throw new Error(`Limit exceeds maximum: ${this.config.maxLimit}`);
    }
  }
}
