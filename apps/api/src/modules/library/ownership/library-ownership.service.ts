import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../infrastructure/persistence/prisma.service.js";

@Injectable()
export class LibraryOwnershipService {
  constructor(private readonly prisma: PrismaService) {}

  async ownsEdition(userId: string, editionId: string): Promise<boolean> {
    const item = await this.prisma.libraryItem.findUnique({
      where: { userId_editionId: { userId, editionId } },
      select: { id: true },
    });
    return item !== null;
  }
}
