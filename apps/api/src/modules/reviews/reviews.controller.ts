import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../identity/presentation/guards/jwt-auth.guard.js";
import { RolesGuard } from "../identity/presentation/guards/roles.guard.js";
import { Roles } from "../identity/presentation/decorators/roles.decorator.js";
import { Role } from "../identity/domain/role.enum.js";
import { ReviewsService } from "./reviews.service.js";

interface AuthenticatedRequest {
  user: { sub: string; role: Role; isEmailConfirmed: boolean };
}

@Controller()
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Get("works/:workId/reviews")
  listForWork(
    @Param("workId") workId: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.reviews.listForWork(workId, page, limit);
  }

  @Post("works/:workId/reviews")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CUSTOMER)
  create(
    @Param("workId") workId: string,
    @Body() body: { rating?: unknown; comment?: unknown },
    @Req() request: AuthenticatedRequest,
  ) {
    return this.reviews.createReview(
      request.user.sub,
      request.user.isEmailConfirmed,
      workId,
      body?.rating,
      body?.comment,
    );
  }

  @Post("reviews/:reviewId/reports")
  @UseGuards(JwtAuthGuard)
  report(
    @Param("reviewId") reviewId: string,
    @Body() body: { reason?: unknown },
    @Req() request: AuthenticatedRequest,
  ) {
    return this.reviews.reportReview(request.user.sub, reviewId, body?.reason);
  }

  @Get("admin/review-reports")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  listOpenReports() {
    return this.reviews.listOpenReports();
  }

  @Delete("admin/reviews/:reviewId")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  remove(
    @Param("reviewId") reviewId: string,
    @Body() body: { reason?: unknown },
    @Req() request: AuthenticatedRequest,
  ) {
    return this.reviews.removeReview(reviewId, request.user.sub, body?.reason);
  }
}
