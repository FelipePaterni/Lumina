import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../infrastructure/persistence/prisma.service.js";

@Injectable()
export class WishlistService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    return this.prisma.wishlistItem.findMany({
      where: { userId, work: { isVisible: true } },
      include: {
        work: {
          include: {
            author: true,
            categories: { include: { category: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async add(userId: string, workId: string) {
    const work = await this.prisma.work.findFirst({
      where: { id: workId, isVisible: true },
      select: { id: true },
    });
    if (!work) throw new NotFoundException("Obra não encontrada");

    try {
      return await this.prisma.wishlistItem.create({
        data: { userId, workId },
        include: { work: true },
      });
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "P2002"
      ) {
        throw new ConflictException("Obra já está na wishlist");
      }
      throw error;
    }
  }

  async remove(userId: string, workId: string): Promise<{ removed: true }> {
    const result = await this.prisma.wishlistItem.deleteMany({
      where: { userId, workId },
    });
    if (result.count === 0) {
      throw new NotFoundException("Obra não encontrada na wishlist");
    }
    return { removed: true };
  }
}
