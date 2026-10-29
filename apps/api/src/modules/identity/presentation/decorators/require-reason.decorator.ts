import { SetMetadata } from "@nestjs/common";

export const REQUIRE_REASON_KEY = "require_reason";
export const RequireReason = () => SetMetadata(REQUIRE_REASON_KEY, true);
