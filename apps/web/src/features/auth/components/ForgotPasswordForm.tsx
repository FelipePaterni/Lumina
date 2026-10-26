"use client";

import React, { useState } from "react";
import { forgotPasswordRequest } from "../services/auth-api.js";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await forgotPasswordRequest({ email });
      setMessage(res.message);
    } catch {
      setMessage("Erro na solicitação.");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "flex", flexDirection: "column", gap: "8px" }}
    >
      <h2>Esqueci a Senha</h2>
      <input
        type="email"
        placeholder="E-mail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <button type="submit">Enviar Instruções</button>
      {message && <p>{message}</p>}
    </form>
  );
}
