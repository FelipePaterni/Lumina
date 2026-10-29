export interface DeactivationResult {
  message: string;
  deactivatedAt: string;
  scheduledDeletionAt: string;
}

export interface ReactivationResult {
  message: string;
  isActive: boolean;
}

export interface UserManagementItem {
  id: string;
  email: string;
  role: "ADMIN" | "CATALOG" | "STOCK" | "CUSTOMER";
  isActive: boolean;
  isEmailConfirmed: boolean;
  deactivatedAt: string | null;
  createdAt: string;
}

export class AccountApiClient {
  private readonly baseUrl: string;

  constructor(baseUrl = "http://localhost:3001") {
    this.baseUrl = baseUrl;
  }

  async requestAccountDeletion(
    token: string,
    reason?: string,
  ): Promise<DeactivationResult> {
    const response = await fetch(`${this.baseUrl}/account/deactivate-request`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ reason }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || "Falha ao solicitar exclusão da conta");
    }

    return response.json();
  }

  async reactivateAccount(token: string): Promise<ReactivationResult> {
    const response = await fetch(`${this.baseUrl}/account/reactivate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || "Falha ao reativar a conta");
    }

    return response.json();
  }

  async listUsers(
    token: string,
    page = 1,
    limit = 20,
    role?: string,
  ): Promise<{ users: UserManagementItem[]; total: number }> {
    const url = new URL(`${this.baseUrl}/admin/users`);
    url.searchParams.set("page", String(page));
    url.searchParams.set("limit", String(limit));
    if (role) url.searchParams.set("role", role);

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || "Falha ao listar usuários");
    }

    return response.json();
  }

  async updateUserRole(
    token: string,
    userId: string,
    newRole: string,
    reason: string,
  ): Promise<{ id: string; email: string; role: string }> {
    const response = await fetch(`${this.baseUrl}/admin/users/${userId}/role`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ role: newRole, reason }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || "Falha ao atualizar papel do usuário");
    }

    return response.json();
  }
}

export const accountApi = new AccountApiClient();
