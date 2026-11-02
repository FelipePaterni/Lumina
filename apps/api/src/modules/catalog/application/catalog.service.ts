import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../infrastructure/persistence/prisma.service.js";
import { EditionFormat } from "@prisma/client";

export interface EditionInput { format: EditionFormat; isbn?: string; priceCents: number; isVisible?: boolean }
export interface WorkInput { title: string; author: string; publisher: string; synopsis: string; releaseDate: string; editions: EditionInput[]; categories?: string[]; slug?: string; coverUrl?: string; isbn?: string; language?: string; edition?: string; isVisible?: boolean; reason?: string }

const digits = (value: string) => value.replace(/\D/g, "");
export function validIsbn(value?: string | null): boolean {
  if (!value) return true;
  const isbn = digits(value);
  if (isbn.length === 10) { let sum = 0; for (let i = 0; i < 10; i++) sum += (isbn[i] === "X" ? 10 : Number(isbn[i])) * (10 - i); return sum % 11 === 0; }
  if (isbn.length === 13) { let sum = 0; for (let i = 0; i < 13; i++) sum += Number(isbn[i]) * (i % 2 ? 3 : 1); return sum % 10 === 0; }
  return false;
}

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}
  async list(query: { search?: string; category?: string; visibleOnly?: boolean }) {
    return this.prisma.work.findMany({ where: { isVisible: query.visibleOnly !== false ? true : undefined, OR: query.search ? [{ title: { contains: query.search, mode: "insensitive" } }, { author: { name: { contains: query.search, mode: "insensitive" } } }] : undefined, categories: query.category ? { some: { category: { name: query.category } } } : undefined }, include: { author: true, publisher: true, categories: { include: { category: true } }, editions: true }, orderBy: { title: "asc" } });
  }
  async get(slug: string, includeHidden = false) { const item = await this.prisma.work.findFirst({ where: { slug, isVisible: includeHidden ? undefined : true }, include: { author: true, publisher: true, categories: { include: { category: true } }, editions: true } }); if (!item) throw new NotFoundException("Obra não encontrada"); return item; }
  async upsert(input: WorkInput, id?: string) {
    if (!input.title || !input.author || !input.publisher || !input.synopsis || !input.releaseDate || !input.editions?.length) throw new BadRequestException("Metadados e ao menos uma edição são obrigatórios");
    if (input.isbn && !validIsbn(input.isbn)) throw new BadRequestException("ISBN inválido");
    for (const edition of input.editions) if (!validIsbn(edition.isbn) || !Number.isInteger(edition.priceCents) || edition.priceCents < 0) throw new BadRequestException("Edição inválida");
    const slug = input.slug ?? input.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    return this.prisma.$transaction(async (tx) => {
      const author = await tx.author.upsert({ where: { name: input.author }, update: {}, create: { name: input.author } });
      const publisher = await tx.publisher.upsert({ where: { name: input.publisher }, update: {}, create: { name: input.publisher } });
      const categories = await Promise.all((input.categories ?? []).map((name: string) => tx.category.upsert({ where: { name }, update: {}, create: { name } })));
      const data = { title: input.title, slug, synopsis: input.synopsis, coverUrl: input.coverUrl, isbn: input.isbn, language: input.language ?? "pt-BR", releaseDate: new Date(input.releaseDate), edition: input.edition, isVisible: input.isVisible !== false, authorId: author.id, publisherId: publisher.id };
      const work = id ? await tx.work.update({ where: { id }, data }) : await tx.work.create({ data });
      if (id) { await tx.workCategory.deleteMany({ where: { workId: work.id } }); await tx.edition.deleteMany({ where: { workId: work.id } }); }
      if (categories.length) await tx.workCategory.createMany({ data: categories.map((category) => ({ workId: work.id, categoryId: category.id })) });
      await tx.edition.createMany({ data: input.editions.map((e) => ({ workId: work.id, format: e.format, isbn: e.isbn, priceCents: e.priceCents, isVisible: e.isVisible !== false })) });
      return this.get(work.slug, true);
    });
  }
  async hide(id: string, isVisible: boolean) { return this.prisma.work.update({ where: { id }, data: { isVisible } }); }
}
