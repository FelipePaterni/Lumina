import { API_URL } from "../auth/services/auth-api";

export interface WishlistEntry {
  id: string;
  workId: string;
  createdAt: string;
  work: { id: string; title: string; slug: string };
}

export class WishlistApi {
  constructor(private readonly baseUrl = API_URL) {}

  async list(token: string): Promise<WishlistEntry[]> {
    const response = await fetch(`${this.baseUrl}/wishlist`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error("Não foi possível carregar a wishlist");
    return response.json();
  }

  async add(token: string, workId: string): Promise<WishlistEntry> {
    const response = await fetch(`${this.baseUrl}/wishlist`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ workId }),
    });
    if (!response.ok) throw new Error("Não foi possível adicionar a obra");
    return response.json();
  }

  async remove(token: string, workId: string): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/wishlist/${encodeURIComponent(workId)}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    if (!response.ok) throw new Error("Não foi possível remover a obra");
  }
}

export const wishlistApi = new WishlistApi();
