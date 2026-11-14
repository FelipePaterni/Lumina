"use client";

import { useEffect, useState } from "react";
import { wishlistApi, type WishlistEntry } from "./wishlist-api.js";

export function WishlistPanel({
  token,
  workIdToAdd,
}: {
  token: string;
  workIdToAdd?: string;
}) {
  const [items, setItems] = useState<WishlistEntry[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    wishlistApi
      .list(token)
      .then((result) => {
        if (active) setItems(result);
      })
      .catch(() => {
        if (active) setMessage("Não foi possível carregar sua lista.");
      });
    return () => {
      active = false;
    };
  }, [token]);

  async function addWork() {
    if (!workIdToAdd) return;
    try {
      const added = await wishlistApi.add(token, workIdToAdd);
      setItems((current) => [added, ...current]);
      setMessage("Obra adicionada à wishlist.");
    } catch {
      setMessage("Não foi possível adicionar a obra à wishlist.");
    }
  }

  async function removeWork(workId: string) {
    try {
      await wishlistApi.remove(token, workId);
      setItems((current) => current.filter((item) => item.workId !== workId));
      setMessage("Obra removida da wishlist.");
    } catch {
      setMessage("Não foi possível remover a obra da wishlist.");
    }
  }

  return (
    <section aria-label="Minha wishlist">
      <h2>Minha wishlist</h2>
      {workIdToAdd && (
        <button type="button" onClick={addWork}>
          Adicionar à wishlist
        </button>
      )}
      {message && <p role="status">{message}</p>}
      {items.length === 0 ? (
        <p>Sua wishlist está vazia.</p>
      ) : (
        <ul>
          {items.map((item) => (
            <li key={item.id}>
              {item.work.title}{" "}
              <button type="button" onClick={() => removeWork(item.workId)}>
                Remover
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
