import { Module } from "@nestjs/common";
import { PrismaModule } from "../../../infrastructure/persistence/prisma.module.js";
import { LibraryOwnershipService } from "./library-ownership.service.js";

@Module({ imports: [PrismaModule], providers: [LibraryOwnershipService], exports: [LibraryOwnershipService] })
export class LibraryOwnershipModule {}
