import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { EditionFormat, Prisma } from "@prisma/client";
import { PrismaService } from "../../infrastructure/persistence/prisma.service.js";
import { BundleRuleError, compositionKey, normalizeComposition } from "./bundle.rules.js";

const bundleInclude = {
  items: {
    orderBy: { workId: "asc" as const },
    include: {
      work: {
        select: {
          id: true,
          title: true,
          releaseDate: true,
          editions: {
            where: { format: EditionFormat.DIGITAL },
            select: { id: true, priceCents: true, isVisible: true, inventory: true },
          },
        },
      },
    },
  },
} satisfies Prisma.BundleInclude;

@Injectable()
export class BundleService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const bundles = await this.prisma.bundle.findMany({
      where: { isActive: true },
      include: bundleInclude,
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    });
    return bundles.map((bundle) => this.present(bundle));
  }

  async get(bundleId: string) {
    if (!this.isUuid(bundleId)) throw new NotFoundException("Bundle não encontrado");
    const bundle = await this.prisma.bundle.findFirst({
      where: { id: bundleId, isActive: true },
      include: bundleInclude,
    });
    if (!bundle) throw new NotFoundException("Bundle não encontrado");
    return this.present(bundle);
  }

  async create(input: { name: unknown; priceCents: unknown; workIds: unknown }) {
    if (typeof input.name !== "string" || input.name.trim().length < 1 || [...input.name.trim()].length > 120) {
      throw new BadRequestException("Nome de bundle inválido");
    }
    if (!Number.isSafeInteger(input.priceCents) || (input.priceCents as number) < 0) {
      throw new BadRequestException("Preço do bundle inválido");
    }
    let workIds: string[];
    try {
      workIds = normalizeComposition(input.workIds);
    } catch (error) {
      if (error instanceof BundleRuleError) throw new BadRequestException("Composição de bundle inválida");
      throw error;
    }

    const eligibleWorks = await this.prisma.work.findMany({
      where: {
        id: { in: workIds },
        isVisible: true,
        editions: { some: { format: EditionFormat.DIGITAL, isVisible: true, inventory: { isNot: null } } },
      },
      select: { id: true },
    });
    if (eligibleWorks.length !== workIds.length) {
      throw new BadRequestException("Todos os livros do bundle devem existir e ter edição digital visível com disponibilidade configurada");
    }

    try {
      const bundle = await this.prisma.bundle.create({
        data: {
          name: input.name.trim(),
          priceCents: input.priceCents as number,
          compositionKey: compositionKey(workIds),
          items: { create: workIds.map((workId) => ({ workId })) },
        },
        include: bundleInclude,
      });
      return this.present(bundle);
    } catch (error) {
      if (this.prismaCode(error) === "P2002") {
        throw new ConflictException("Já existe um bundle com esta composição");
      }
      throw error;
    }
  }

  private present(bundle: Prisma.BundleGetPayload<{ include: typeof bundleInclude }>) {
    return {
      id: bundle.id,
      name: bundle.name,
      priceCents: bundle.priceCents,
      isActive: bundle.isActive,
      items: bundle.items.map(({ work }) => ({
        workId: work.id,
        title: work.title,
        releaseAt: work.releaseDate,
        editionId: work.editions[0]?.id ?? null,
        currentPriceCents: work.editions[0]?.priceCents ?? null,
        available: work.editions[0]?.isVisible ?? false,
      })),
    };
  }

  private isUuid(value: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }

  private prismaCode(error: unknown): string | undefined {
    return typeof error === "object" && error !== null && "code" in error && typeof error.code === "string"
      ? error.code
      : undefined;
  }
}
