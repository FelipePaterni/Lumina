import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../infrastructure/persistence/prisma.service.js";
import { AuditService } from "../audit/application/services/audit.service.js";
import { Role } from "../identity/domain/role.enum.js";

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async listForWork(workId: string, pageValue?: string, limitValue?: string) {
    const work = await this.prisma.work.findFirst({
      where: { id: workId, isVisible: true },
      select: { id: true },
    });
    if (!work) throw new NotFoundException("Obra não encontrada");

    const page = this.toPositiveInteger(pageValue, 1, 1_000_000);
    const limit = this.toPositiveInteger(limitValue, 20, 50);
    const where = { workId, isVisible: true };
    const [items, total, aggregate] = await Promise.all([
      this.prisma.review.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: { id: true, rating: true, comment: true, createdAt: true },
      }),
      this.prisma.review.count({ where }),
      this.prisma.review.aggregate({ where, _avg: { rating: true } }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      averageRating: aggregate._avg.rating,
    };
  }

  async createReview(
    userId: string,
    isEmailConfirmed: boolean,
    workId: string,
    ratingValue: unknown,
    commentValue: unknown,
  ) {
    if (!isEmailConfirmed) {
      throw new BadRequestException("Confirme seu e-mail para avaliar obras");
    }
    if (
      !Number.isInteger(ratingValue) ||
      (ratingValue as number) < 1 ||
      (ratingValue as number) > 5
    ) {
      throw new BadRequestException(
        "A nota deve ser um número inteiro entre 1 e 5",
      );
    }
    if (typeof commentValue !== "string") {
      throw new BadRequestException("Comentário é obrigatório");
    }
    const comment = commentValue.trim();
    if (!comment || comment.length > 2000) {
      throw new BadRequestException(
        "Comentário deve ter entre 1 e 2000 caracteres",
      );
    }

    const work = await this.prisma.work.findFirst({
      where: { id: workId, isVisible: true },
      select: { id: true },
    });
    if (!work) throw new NotFoundException("Obra não encontrada");

    const purchases = await this.prisma.orderItem.findMany({
      where: {
        edition: { workId },
        order: { userId, status: { in: ["CONFIRMED", "PARTIALLY_REFUNDED"] } },
      },
      select: {
        quantity: true,
        refunds: {
          where: { status: "PROCESSED" },
          select: { quantity: true },
        },
      },
    });
    const hasUnrefundedAcquisition = purchases.some(
      (purchase) =>
        purchase.quantity -
          purchase.refunds.reduce(
            (total, refund) => total + refund.quantity,
            0,
          ) >
        0,
    );
    if (!hasUnrefundedAcquisition) {
      throw new ConflictException(
        "Somente adquirentes da obra podem avaliá-la",
      );
    }

    try {
      return await this.prisma.review.create({
        data: {
          userId,
          workId,
          rating: ratingValue as number,
          comment,
        },
        select: { id: true, rating: true, comment: true, createdAt: true },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException("Você já avaliou esta obra");
      }
      throw error;
    }
  }

  async reportReview(
    reporterId: string,
    reviewId: string,
    reasonValue: unknown,
  ) {
    if (typeof reasonValue !== "string") {
      throw new BadRequestException("Motivo da denúncia é obrigatório");
    }
    const reason = reasonValue.trim();
    if (reason.length < 5 || reason.length > 500) {
      throw new BadRequestException("Motivo deve ter entre 5 e 500 caracteres");
    }
    const review = await this.prisma.review.findFirst({
      where: { id: reviewId, isVisible: true },
      select: { id: true },
    });
    if (!review) throw new NotFoundException("Avaliação não encontrada");

    try {
      return await this.prisma.reviewReport.create({
        data: { reviewId, reporterId, reason },
        select: { id: true, reviewId: true, status: true, createdAt: true },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException("Você já denunciou esta avaliação");
      }
      throw error;
    }
  }

  listOpenReports() {
    return this.prisma.reviewReport.findMany({
      where: { status: "OPEN" },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        reviewId: true,
        reason: true,
        status: true,
        createdAt: true,
        review: {
          select: {
            workId: true,
            rating: true,
            comment: true,
            isVisible: true,
          },
        },
      },
    });
  }

  async removeReview(reviewId: string, adminId: string, reasonValue: unknown) {
    if (typeof reasonValue !== "string") {
      throw new BadRequestException("Motivo da remoção é obrigatório");
    }
    const reason = reasonValue.trim();
    if (reason.length < 5 || reason.length > 500) {
      throw new BadRequestException("Motivo deve ter entre 5 e 500 caracteres");
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const review = await tx.review.findUnique({ where: { id: reviewId } });
        if (!review) throw new NotFoundException("Avaliação não encontrada");
        if (!review.isVisible)
          throw new ConflictException("Avaliação já removida");

        const removed = await tx.review.update({
          where: { id: reviewId },
          data: {
            isVisible: false,
            moderationReason: reason,
            moderatedById: adminId,
            moderatedAt: new Date(),
          },
          select: { id: true, isVisible: true, moderatedAt: true },
        });
        await tx.reviewReport.updateMany({
          where: { reviewId, status: "OPEN" },
          data: { status: "ACTIONED" },
        });
        await this.audit.logActionInTransaction(tx, {
          actorId: adminId,
          actorRole: Role.ADMIN,
          action: "REVIEW_REMOVED",
          targetType: "REVIEW",
          targetId: reviewId,
          reason,
          metadata: { workId: review.workId },
        });
        return removed;
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        throw new NotFoundException("Avaliação não encontrada");
      }
      throw error;
    }
  }

  private toPositiveInteger(
    value: string | undefined,
    fallback: number,
    max: number,
  ) {
    if (value === undefined) return fallback;
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 1) {
      throw new BadRequestException("Paginação inválida");
    }
    return Math.min(parsed, max);
  }
}
