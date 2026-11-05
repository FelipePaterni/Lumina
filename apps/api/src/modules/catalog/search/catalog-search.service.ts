import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../../infrastructure/persistence/prisma.service.js";

export interface CatalogSearchQuery {
  search?: string;
  category?: string;
  language?: string;
  minPriceCents?: number;
  maxPriceCents?: number;
  releaseFrom?: string;
  releaseTo?: string;
  page?: number;
  limit?: number;
}

export function normalizeSearchQuery(query: CatalogSearchQuery) {
  const page = Number.isInteger(query.page) && query.page! > 0 ? query.page! : 1;
  const limit = Number.isInteger(query.limit) && query.limit! > 0 ? Math.min(query.limit!, 50) : 12;
  return { ...query, page, limit };
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
      this.prisma.work.findMany({ where, skip, take: query.limit, include: { author: true, publisher: true, categories: { include: { category: true } }, editions: { where: editionFilter } }, orderBy: [{ releaseDate: "desc" }, { title: "asc" }] }),
      this.prisma.work.count({ where }),
    ]);
    return { items, page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) };
  }
}
