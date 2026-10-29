export interface UpdateRoleDto {
  role: "ADMIN" | "CATALOG" | "STOCK" | "CUSTOMER";
  reason: string;
}

export interface UpdateStatusDto {
  isActive: boolean;
  reason: string;
}

export interface DeactivateAccountDto {
  reason?: string;
}
