"use client";

import React, { useState } from "react";
import { registerRequest } from "../services/auth-api.js";

export function RegisterForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await registerRequest({ email, password });
      setMessage(res.message || "Cadastro realizado com sucesso!");
    } catch {
      setMessage("Erro na conexão com o servidor.");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "flex", flexDirection: "column", gap: "8px" }}
    >
      <h2>Cadastre-se</h2>
      <input
        type="email"
        placeholder="E-mail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Senha"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit">Cadastrar</button>
      {message && <p>{message}</p>}
    </form>
  );
}
