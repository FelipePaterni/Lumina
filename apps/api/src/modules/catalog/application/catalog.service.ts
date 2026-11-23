import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../../infrastructure/persistence/prisma.service.js";
import { EditionFormat, Prisma } from "@prisma/client";

export interface EditionInput {
  format: EditionFormat;
  isbn?: string;
  priceCents: number;
  isVisible?: boolean;
}
export interface WorkInput {
  title: string;
  author: string;
  publisher: string;
  synopsis: string;
  releaseDate: string;
  editions: EditionInput[];
  categories?: string[];
  slug?: string;
  coverUrl?: string;
  isbn?: string;
  language?: string;
  edition?: string;
  isVisible?: boolean;
  reason?: string;
}

const digits = (value: string) => value.replace(/\D/g, "");
export function validIsbn(value?: string | null): boolean {
  if (!value) return true;
  const isbn = digits(value);
  if (isbn.length === 10) {
    let sum = 0;
    for (let i = 0; i < 10; i++)
      sum += (isbn[i] === "X" ? 10 : Number(isbn[i])) * (10 - i);
    return sum % 11 === 0;
  }
  if (isbn.length === 13) {
    let sum = 0;
    for (let i = 0; i < 13; i++) sum += Number(isbn[i]) * (i % 2 ? 3 : 1);
    return sum % 10 === 0;
  }
  return false;
}

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}
  private async withReviewSummary<T extends { id: string }>(work: T) {
    const summary = await this.prisma.review.aggregate({
      where: { workId: work.id, isVisible: true },
      _avg: { rating: true },
      _count: { _all: true },
    });
    return {
      ...work,
      averageRating: summary._avg.rating,
      reviewCount: summary._count._all,
    };
  }
  async list(query: {
    search?: string;
    category?: string;
    visibleOnly?: boolean;
  }) {
    const works = await this.prisma.work.findMany({
      where: {
        isVisible: query.visibleOnly !== false ? true : undefined,
        OR: query.search
          ? [
              { title: { contains: query.search, mode: "insensitive" } },
              {
                author: {
                  name: { contains: query.search, mode: "insensitive" },
                },
              },
            ]
          : undefined,
        categories: query.category
          ? { some: { category: { name: query.category } } }
          : undefined,
      },
      include: {
        author: true,
        publisher: true,
        categories: { include: { category: true } },
        editions: true,
      },
      orderBy: { title: "asc" },
    });
    const summaries = works.length
      ? await this.prisma.review.groupBy({
          by: ["workId"],
          where: {
            workId: { in: works.map((work) => work.id) },
            isVisible: true,
          },
          _avg: { rating: true },
          _count: { _all: true },
        })
      : [];
    const byWorkId = new Map(
      summaries.map((summary) => [summary.workId, summary]),
    );
    return works.map((work) => {
      const summary = byWorkId.get(work.id);
      return {
        ...work,
        averageRating: summary?._avg.rating ?? null,
        reviewCount: summary?._count._all ?? 0,
      };
    });
  }
  async listAdmin(input: {
    search?: string;
    visibility?: string;
    page?: number;
    limit?: number;
  }) {
    const page =
      Number.isInteger(input.page) && input.page! > 0 ? input.page! : 1;
    const limit =
      Number.isInteger(input.limit) && input.limit! > 0
        ? Math.min(input.limit!, 100)
        : 20;
    const search = input.search?.trim();
    const where: Prisma.WorkWhereInput = {
      ...(input.visibility === "visible" ? { isVisible: true } : {}),
      ...(input.visibility === "hidden" ? { isVisible: false } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { slug: { contains: search, mode: "insensitive" } },
              { author: { name: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.work.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          author: true,
          publisher: true,
          categories: { include: { category: true } },
          editions: true,
        },
        orderBy: [{ title: "asc" }, { id: "asc" }],
      }),
      this.prisma.work.count({ where }),
    ]);
    return { items, page, limit, total, totalPages: Math.ceil(total / limit) };
  }

  async getAdminById(id: string) {
    const work = await this.prisma.work.findUnique({
      where: { id },
      include: {
        author: true,
        publisher: true,
        categories: { include: { category: true } },
        editions: true,
      },
    });
    if (!work) throw new NotFoundException("Obra não encontrada");
    return this.withReviewSummary(work);
  }
  async get(slug: string, includeHidden = false) {
    const item = await this.prisma.work.findFirst({
      where: { slug, isVisible: includeHidden ? undefined : true },
      include: {
        author: true,
        publisher: true,
        categories: { include: { category: true } },
        editions: true,
      },
    });
    if (!item) throw new NotFoundException("Obra não encontrada");
    return this.withReviewSummary(item);
  }
  async upsert(input: WorkInput, id?: string) {
    if (
      !input.title ||
      !input.author ||
      !input.publisher ||
      !input.synopsis ||
      !input.releaseDate ||
      !input.editions?.length
    )
      throw new BadRequestException(
        "Metadados e ao menos uma edição são obrigatórios",
      );
    if (input.isbn && !validIsbn(input.isbn))
      throw new BadRequestException("ISBN inválido");
    for (const edition of input.editions)
      if (
        !validIsbn(edition.isbn) ||
        !Number.isInteger(edition.priceCents) ||
        edition.priceCents < 0
      )
        throw new BadRequestException("Edição inválida");
    if (
      new Set(input.editions.map((edition) => edition.format)).size !==
      input.editions.length
    ) {
      throw new BadRequestException(
        "Não é possível repetir o formato de uma edição.",
      );
    }
    const slug =
      input.slug ??
      input.title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    try {
      return await this.prisma.$transaction(async (tx) => {
        const author = await tx.author.upsert({
          where: { name: input.author },
          update: {},
          create: { name: input.author },
        });
        const publisher = await tx.publisher.upsert({
          where: { name: input.publisher },
          update: {},
          create: { name: input.publisher },
        });
        const categories = await Promise.all(
          (input.categories ?? []).map((name: string) =>
            tx.category.upsert({
              where: { name },
              update: {},
              create: { name },
            }),
          ),
        );
        const data = {
          title: input.title,
          slug,
          synopsis: input.synopsis,
          coverUrl: input.coverUrl,
          isbn: input.isbn,
          language: input.language ?? "pt-BR",
          releaseDate: new Date(input.releaseDate),
          edition: input.edition,
          ...(id && input.isVisible === undefined
            ? {}
            : { isVisible: input.isVisible !== false }),
          authorId: author.id,
          publisherId: publisher.id,
        };
        const work = id
          ? await tx.work.update({ where: { id }, data })
          : await tx.work.create({ data });
        if (id)
          await tx.workCategory.deleteMany({ where: { workId: work.id } });
        if (categories.length)
          await tx.workCategory.createMany({
            data: categories.map((category) => ({
              workId: work.id,
              categoryId: category.id,
            })),
          });
        const existingEditions = id
          ? await tx.edition.findMany({
              where: { workId: work.id },
              select: { id: true, format: true },
            })
          : [];
        for (const editionInput of input.editions) {
          const existingEdition = existingEditions.find(
            (edition) => edition.format === editionInput.format,
          );
          if (existingEdition) {
            await tx.edition.update({
              where: { id: existingEdition.id },
              data: {
                isbn: editionInput.isbn,
                priceCents: editionInput.priceCents,
                isVisible: editionInput.isVisible !== false,
              },
            });
            if (editionInput.format === "DIGITAL") {
              await tx.inventory.upsert({
                where: { editionId: existingEdition.id },
                update: {},
                create: { editionId: existingEdition.id, digitalLicenseLimit: null },
              });
            }
          } else {
            await tx.edition.create({
              data: {
                workId: work.id,
                format: editionInput.format,
                isbn: editionInput.isbn,
                priceCents: editionInput.priceCents,
                isVisible: editionInput.isVisible !== false,
                ...(editionInput.format === "DIGITAL"
                  ? { inventory: { create: { digitalLicenseLimit: null } } }
                  : {}),
              },
            });
          }
        }
        return tx.work.findUniqueOrThrow({
          where: { id: work.id },
          include: {
            author: true,
            publisher: true,
            categories: { include: { category: true } },
            editions: true,
          },
        });
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException("Já existe uma obra com este slug");
      }
      throw error;
    }
  }
  async hide(id: string, isVisible: boolean) {
    return this.prisma.work.update({ where: { id }, data: { isVisible } });
  }
}
