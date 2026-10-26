"use client";

import React, { useState } from "react";
import { resetPasswordRequest } from "../services/auth-api.js";

export function ResetPasswordForm() {
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await resetPasswordRequest({ token, newPassword });
      setMessage(res.message || "Senha atualizada com sucesso.");
    } catch {
      setMessage("Erro ao redefinir senha.");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "flex", flexDirection: "column", gap: "8px" }}
    >
      <h2>Redefinir Senha</h2>
      <input
        type="text"
        placeholder="Token recebido"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Nova Senha"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        required
      />
      <button type="submit">Salvar Nova Senha</button>
      {message && <p>{message}</p>}
    </form>
  );
}
