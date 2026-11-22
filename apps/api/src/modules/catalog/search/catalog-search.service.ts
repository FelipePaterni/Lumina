import { BadRequestException, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../../infrastructure/persistence/prisma.service.js";
import { isCatalogSort } from "./catalog-sort.js";
import type { CatalogSort } from "./catalog-sort.js";

export interface CatalogSearchQuery {
  search?: string;
  category?: string;
  language?: string;
  minPriceCents?: number;
  maxPriceCents?: number;
  releaseFrom?: string;
  releaseTo?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export function normalizeSearchQuery(query: CatalogSearchQuery) {
  if (query.sort && !isCatalogSort(query.sort)) {
    throw new BadRequestException("Parâmetro sort inválido.");
  }
  const page = Number.isInteger(query.page) && query.page! > 0 ? query.page! : 1;
  const limit = Number.isInteger(query.limit) && query.limit! > 0 ? Math.min(query.limit!, 50) : 12;
  return { ...query, sort: query.sort ? query.sort as CatalogSort : undefined, page, limit };
}

function buildRankingWhere(query: ReturnType<typeof normalizeSearchQuery>): Prisma.Sql {
  const filters: Prisma.Sql[] = [Prisma.sql`w.is_visible = TRUE`];
  if (query.search) {
    const escapedSearch = query.search.replace(/[\\%_]/g, "\\$&");
    const pattern = `%${escapedSearch}%`;
    filters.push(Prisma.sql`(w.title ILIKE ${pattern} ESCAPE '\\' OR a.name ILIKE ${pattern} ESCAPE '\\')`);
  }
  if (query.category) {
    filters.push(Prisma.sql`EXISTS (
      SELECT 1
      FROM work_categories AS wc
      INNER JOIN categories AS c ON c.id = wc.category_id
      WHERE wc.work_id = w.id AND c.name = ${query.category}
    )`);
  }
  if (query.language) filters.push(Prisma.sql`w.language = ${query.language}`);
  if (query.releaseFrom) filters.push(Prisma.sql`w.release_date >= ${new Date(query.releaseFrom)}`);
  if (query.releaseTo) filters.push(Prisma.sql`w.release_date <= ${new Date(query.releaseTo)}`);
  if (query.minPriceCents !== undefined || query.maxPriceCents !== undefined) {
    const priceFilters: Prisma.Sql[] = [Prisma.sql`e.work_id = w.id`, Prisma.sql`e.is_visible = TRUE`];
    if (query.minPriceCents !== undefined) priceFilters.push(Prisma.sql`e.price_cents >= ${query.minPriceCents}`);
    if (query.maxPriceCents !== undefined) priceFilters.push(Prisma.sql`e.price_cents <= ${query.maxPriceCents}`);
    filters.push(Prisma.sql`EXISTS (SELECT 1 FROM editions AS e WHERE ${Prisma.join(priceFilters, " AND ")})`);
  }
  return Prisma.join(filters, " AND ");
}

@Injectable()
export class CatalogSearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(input: CatalogSearchQuery) {
    const query = normalizeSearchQuery(input);
    const editionFilter: Prisma.EditionWhereInput = {
      isVisible: true,
      ...(query.minPriceCents !== undefined || query.maxPriceCents !== undefined
        ? { priceCents: { gte: query.minPriceCents, lte: query.maxPriceCents } }
        : {}),
    };
    const where: Prisma.WorkWhereInput = {
      isVisible: true,
      ...(query.search
        ? { OR: [{ title: { contains: query.search, mode: "insensitive" } }, { author: { name: { contains: query.search, mode: "insensitive" } } }] }
        : {}),
      ...(query.category ? { categories: { some: { category: { name: query.category } } } } : {}),
      ...(query.language ? { language: query.language } : {}),
      ...(query.releaseFrom || query.releaseTo
        ? { releaseDate: { gte: query.releaseFrom ? new Date(query.releaseFrom) : undefined, lte: query.releaseTo ? new Date(query.releaseTo) : undefined } }
        : {}),
      ...(query.minPriceCents !== undefined || query.maxPriceCents !== undefined ? { editions: { some: editionFilter } } : {}),
    };
    const skip = (query.page - 1) * query.limit;
    const [items, total] = await Promise.all([
      query.sort
        ? this.findRankedWorks(query, where, editionFilter, skip)
        : this.prisma.work.findMany({ where, skip, take: query.limit, include: { author: true, publisher: true, categories: { include: { category: true } }, editions: { where: editionFilter } }, orderBy: [{ releaseDate: "desc" }, { title: "asc" }] }),
      this.prisma.work.count({ where }),
    ]);
    const reviews = items.length
      ? await this.prisma.review.groupBy({
          by: ["workId"],
          where: { workId: { in: items.map((item) => item.id) }, isVisible: true },
          _avg: { rating: true },
          _count: { _all: true },
        })
      : [];
    const byWorkId = new Map(reviews.map((review) => [review.workId, review]));
    const itemsWithReviewSummary = items.map((item) => {
      const summary = byWorkId.get(item.id);
      return { ...item, averageRating: summary?._avg.rating ?? null, reviewCount: summary?._count._all ?? 0 };
    });
    return { items: itemsWithReviewSummary, page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) };
  }

  private async findRankedWorks(
    query: ReturnType<typeof normalizeSearchQuery>,
    where: Prisma.WorkWhereInput,
    editionFilter: Prisma.EditionWhereInput,
    skip: number,
  ) {
    const searchWhere = buildRankingWhere(query);
    const rankedIds = query.sort === "BEST_SELLING"
      ? await this.prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
          WITH filtered_works AS (
            SELECT w.id, w.title
            FROM works AS w
            INNER JOIN authors AS a ON a.id = w.author_id
            WHERE ${searchWhere}
          ), sales AS (
            SELECT e.work_id,
              SUM(oi.quantity - COALESCE(processed_refunds.quantity, 0)) AS net_units
            FROM order_items AS oi
            INNER JOIN orders AS o ON o.id = oi.order_id
            INNER JOIN editions AS e ON e.id = oi.edition_id
            LEFT JOIN LATERAL (
              SELECT SUM(r.quantity) AS quantity
              FROM refunds AS r
              WHERE r.order_item_id = oi.id AND r.status::text = 'PROCESSED'
            ) AS processed_refunds ON TRUE
            WHERE o.status::text IN ('CONFIRMED', 'PARTIALLY_REFUNDED', 'REFUNDED')
            GROUP BY e.work_id
          )
          SELECT filtered_works.id
          FROM filtered_works
          LEFT JOIN sales ON sales.work_id = filtered_works.id
          ORDER BY COALESCE(sales.net_units, 0) DESC, filtered_works.title ASC, filtered_works.id ASC
          LIMIT ${query.limit} OFFSET ${skip}
        `)
      : await this.prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
          WITH filtered_works AS (
            SELECT w.id, w.title
            FROM works AS w
            INNER JOIN authors AS a ON a.id = w.author_id
            WHERE ${searchWhere}
          ), visible_ratings AS (
            SELECT r.work_id, AVG(r.rating)::numeric AS average_rating
            FROM reviews AS r
            WHERE r.is_visible = TRUE
            GROUP BY r.work_id
          )
          SELECT filtered_works.id
          FROM filtered_works
          LEFT JOIN visible_ratings ON visible_ratings.work_id = filtered_works.id
          ORDER BY visible_ratings.average_rating DESC NULLS LAST, filtered_works.title ASC, filtered_works.id ASC
          LIMIT ${query.limit} OFFSET ${skip}
        `);

    if (!rankedIds.length) return [];
    const rankedIdList = rankedIds.map(({ id }) => id);
    const works = await this.prisma.work.findMany({
      where: { AND: [where, { id: { in: rankedIdList } }] },
      include: {
        author: true,
        publisher: true,
        categories: { include: { category: true } },
        editions: { where: editionFilter },
      },
    });
    const worksById = new Map(works.map((work) => [work.id, work]));
    return rankedIdList.flatMap((id) => {
      const work = worksById.get(id);
      return work ? [work] : [];
    });
  }
}
