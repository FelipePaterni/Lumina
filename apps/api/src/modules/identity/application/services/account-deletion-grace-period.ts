import { Injectable } from "@nestjs/common";

const DEFAULT_GRACE_PERIOD_DAYS = 30;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

@Injectable()
export class AccountDeletionGracePeriod {
  readonly days: number;

  constructor() {
    this.days = AccountDeletionGracePeriod.parseDays(process.env.ACCOUNT_DELETION_GRACE_PERIOD_DAYS);
  }

  get milliseconds(): number {
    return this.days * MILLISECONDS_PER_DAY;
  }

  static parseDays(value: string | undefined): number {
    if (value === undefined) return DEFAULT_GRACE_PERIOD_DAYS;
    if (!/^\d+$/.test(value)) {
      throw new Error("ACCOUNT_DELETION_GRACE_PERIOD_DAYS must be a positive integer");
    }
    const days = Number(value);
    const maxSupportedDays = Math.floor((8_640_000_000_000_000 - Date.now()) / MILLISECONDS_PER_DAY);
    if (!Number.isSafeInteger(days) || days <= 0 || days > maxSupportedDays) {
      throw new Error("ACCOUNT_DELETION_GRACE_PERIOD_DAYS must be a positive integer");
    }
    return days;
  }
}
