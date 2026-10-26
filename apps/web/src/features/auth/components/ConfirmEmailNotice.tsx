"use client";

import React, { useState } from "react";
import { confirmEmailRequest } from "../services/auth-api.js";

export function ConfirmEmailNotice() {
  const [token, setToken] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await confirmEmailRequest({ token });
      setMessage(res.message || "E-mail confirmado!");
    } catch {
      setMessage("Erro ao confirmar token.");
    }
  };

  return (
    <form
      onSubmit={handleConfirm}
      style={{ display: "flex", flexDirection: "column", gap: "8px" }}
    >
      <h2>Confirmação de E-mail</h2>
      <input
        type="text"
        placeholder="Código ou token de ativação"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        required
      />
      <button type="submit">Confirmar E-mail</button>
      {message && <p>{message}</p>}
    </form>
  );
}
