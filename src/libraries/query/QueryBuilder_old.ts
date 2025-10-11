/* eslint-disable security/detect-object-injection */
import { Model, PopulateOptions } from 'mongoose';

/**
 * =============================
 * Types & Interfaces
 * =============================
 */

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
  enableTextSearch?: boolean;
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

export class QueryBuilder {
  private config: Required<QueryConfig>;
  private queryParams: QueryParams = {};
  private model!: Model<any>;
  private populateFields: PopulateOptions[] = [];
  private isLean = false;
  private customSelect?: string;
  private projection?: Record<string, 0 | 1>;
  private isPaginated = false;
  private indexHint?: string | Record<string, 1 | -1>;
  private shouldExplain = false;
  private distinctField?: string;
  private collation?: any;
  private customFilters: Record<string, any>[] = [];

  constructor(config: QueryConfig = {}) {
    this.config = {
      searchFields: config.searchFields || [],
      sortableFields: config.sortableFields || [],
      selectableFields: config.selectableFields || [],
      filterableFields: config.filterableFields || [],
      defaultSort: config.defaultSort || 'createdAt',
      defaultLimit: config.defaultLimit || 20,
      maxLimit: config.maxLimit || 100,
      enableTextSearch: config.enableTextSearch ?? false,
    };
  }

  /**
   * Initialize a new query chain
   */
  query(model: Model<any>, queryParams: QueryParams = {}): this {
    this.model = model;
    this.queryParams = queryParams;
    this.reset();
    return this;
  }

  /**
   * Populate related documents
   * IMPORTANT: If you need virtuals on populated documents while using lean(),
   * you must remove lean() or manually add the virtual fields after the query.
   *
   * @param fields - Field name(s) or PopulateOptions
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

  /**
   * Enable lean mode (returns plain JS objects instead of Mongoose documents)
   * WARNING: Virtual fields (including those on populated documents) will NOT be included when using lean().
   * If you need virtuals, do NOT use lean().
   *
   * @param useLean - Enable/disable lean mode
   */
  lean(useLean = true): this {
    this.isLean = useLean;
    return this;
  }

  /**
   * Select specific fields (comma-separated string)
   */
  select(fields: string): this {
    this.customSelect = fields;
    return this;
  }

  /**
   * Specify field projection ({ field: 1, field2: 0 })
   */
  project(fields: Record<string, 0 | 1>): this {
    this.projection = fields;
    return this;
  }

  /**
   * Add index hint for query optimization
   */
  hint(index: string | Record<string, 1 | -1>): this {
    this.indexHint = index;
    return this;
  }

  /**
   * Add collation for case-insensitive sorting/filtering
   */
  withCollation(collation: any): this {
    this.collation = collation;
    return this;
  }

  /**
   * Get distinct values for a field
   */
  distinct(field: string): this {
    this.distinctField = field;
    return this;
  }

  /**
   * Enable query explanation for debugging
   */
  explain(): this {
    this.shouldExplain = true;
    return this;
  }

  /**
   * Add custom filter conditions
   */
  where(filter: Record<string, any>): this {
    this.customFilters.push(filter);
    return this;
  }

  /**
   * Sets the builder state to perform a paginated execution
   */
  paginate(): this {
    this.isPaginated = true;
    return this;
  }

  /**
   * Execute the query and return results
   * @template T - The type of the document being queried
   */
  async execute<T = any>(): Promise<T[] | PaginatedData<T> | any> {
    this.validateQuery();

    // Handle distinct queries
    if (this.distinctField) {
      const { filter } = this.parse();
      let query = this.model.find(filter).distinct(this.distinctField);
      if (this.collation) {
        query = query.collation(this.collation);
      }
      return await query;
    }

    const { filter, sort, pagination, select } = this.parse();

    if (this.isPaginated) {
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
      } as PaginatedData<T>;
    } else {
      return await this.executeStandardQuery<T>(filter, sort, select);
    }
  }

  /**
   * Count documents matching the query
   */
  async count(): Promise<number> {
    this.validateQuery();
    const { filter } = this.parse();
    return await this.model.countDocuments(filter);
  }

  /**
   * Check if any documents exist matching the query
   */
  async exists(): Promise<boolean> {
    this.validateQuery();
    const { filter } = this.parse();
    const doc = await this.model.exists(filter);
    return doc !== null;
  }

  /**
   * Find a single document
   */
  async findOne<T = any>(): Promise<T | null> {
    this.validateQuery();
    const { filter, select } = this.parse();

    let query = this.model.findOne(filter);

    if (this.customSelect || select.length > 0) {
      query = query.select(this.customSelect || select.join(' '));
    }

    if (this.projection) {
      query = query.select(this.projection);
    }

    if (this.populateFields.length > 0) {
      query = query.populate(this.populateFields);
    }

    if (this.isLean) {
      query = query.lean();
    }

    if (this.indexHint) {
      query = query.hint(this.indexHint);
    }

    if (this.collation) {
      query = query.collation(this.collation);
    }

    if (this.shouldExplain) {
      return (await query.explain()) as any;
    }

    return await query;
  }

  /**
   * Returns the parsed query configuration without executing
   */
  getQuery(): ParsedQuery {
    return this.parse();
  }

  /**
   * Get the raw filter object
   */
  getFilter(): Record<string, any> {
    const filter = this.buildFilter();
    const searchConditions = this.buildSearch();
    return this.combineFilterAndSearch(filter, searchConditions);
  }

  // ============================================
  // PRIVATE METHODS
  // ============================================

  private reset(): void {
    this.isPaginated = false;
    this.populateFields = [];
    this.isLean = false;
    this.customSelect = undefined;
    this.projection = undefined;
    this.indexHint = undefined;
    this.shouldExplain = false;
    this.distinctField = undefined;
    this.collation = undefined;
    this.customFilters = [];
  }

  private async executeStandardQuery<T>(
    filter: Record<string, any>,
    sort: SortOptions,
    select: string[]
  ): Promise<T[]> {
    let query = this.model.find(filter);

    if (this.customSelect || select.length > 0) {
      query = query.select(this.customSelect || select.join(' '));
    }

    if (this.projection) {
      query = query.select(this.projection);
    }

    if (this.populateFields.length > 0) {
      query = query.populate(this.populateFields);
    }

    if (this.isLean) {
      query = query.lean();
    }

    if (this.indexHint) {
      query = query.hint(this.indexHint);
    }

    if (this.collation) {
      query = query.collation(this.collation);
    }

    query = query.sort(sort);

    if (this.shouldExplain) {
      return (await query.explain()) as any;
    }

    return await query;
  }

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

    if (this.projection) {
      query = query.select(this.projection);
    }

    if (this.populateFields.length > 0) {
      query = query.populate(this.populateFields);
    }

    if (this.isLean) {
      query = query.lean();
    }

    if (this.indexHint) {
      query = query.hint(this.indexHint);
    }

    if (this.collation) {
      query = query.collation(this.collation);
    }

    if (this.shouldExplain) {
      return {
        items: (await query
          .sort(sort)
          .skip(pagination.skip)
          .limit(pagination.limit)
          .explain()) as any,
        totalCount: 0,
      };
    }

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

    const finalFilter =
      this.customFilters.length > 0
        ? { $and: [combinedFilter, ...this.customFilters] }
        : combinedFilter;

    return {
      filter: finalFilter,
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
          regex: '$regex',
          exists: '$exists',
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
    if (!this.queryParams.search) return {};

    // Use MongoDB text search if enabled and available
    if (this.config.enableTextSearch) {
      const textIndexes = this.model.schema
        .indexes()
        .filter(([fields]) => Object.values(fields).some(val => val === 'text'));

      if (textIndexes.length > 0) {
        return { $text: { $search: this.queryParams.search } };
      }
    }

    // Fallback to regex search
    if (this.config.searchFields.length === 0) return {};

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
    if (value === 'undefined') return undefined;
    if (value !== '' && !isNaN(Number(value))) return Number(value);
    if (value.includes(',')) return value.split(',').map(v => this.parseValue(v.trim()));
    return value;
  }

  private isObject(value: any): boolean {
    return value !== null && typeof value === 'object' && value.constructor === Object;
  }

  private validateQuery(): void {
    if (!this.model) {
      throw new Error('Model not initialized. Call .query(model, params) first.');
    }

    if (this.queryParams.limit && Number(this.queryParams.limit) > this.config.maxLimit) {
      throw new Error(`Limit exceeds maximum allowed: ${this.config.maxLimit}`);
    }

    // Validate populate paths exist in schema
    if (this.populateFields.length > 0) {
      const schema = this.model.schema;
      this.populateFields.forEach(pop => {
        const path = typeof pop === 'string' ? pop : pop.path;
        if (path && !schema.path(path) && !schema.virtualpath(path)) {
          console.warn(`[QueryBuilder] Warning: Populate path '${path}' not found in schema`);
        }
      });
    }

    // Validate sort fields
    if (this.config.sortableFields.length > 0 && this.queryParams.sort) {
      const sortFields = this.queryParams.sort
        .split(',')
        .map((f: string) => f.replace('-', '').trim());
      const invalidFields = sortFields.filter(
        (f: string) => !this.config.sortableFields.includes(f)
      );
      if (invalidFields.length > 0) {
        console.warn(`[QueryBuilder] Warning: Invalid sort fields: ${invalidFields.join(', ')}`);
      }
    }
  }
}

/**
 * Factory function for creating QueryBuilder instances
 */
export function createQueryBuilder(config?: QueryConfig): QueryBuilder {
  return new QueryBuilder(config);
}
