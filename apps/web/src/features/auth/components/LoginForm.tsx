"use client";

import React, { useState } from "react";
import { loginRequest } from "../services/auth-api.js";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await loginRequest({ email, password });
      if (res.accessToken) {
        setMessage("Autenticado com sucesso!");
      } else {
        setMessage(res.message || "Falha ao autenticar.");
      }
    } catch {
      setMessage("Erro na conexão com o servidor.");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "flex", flexDirection: "column", gap: "8px" }}
    >
      <h2>Entrar</h2>
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
      <button type="submit">Entrar</button>
      {message && <p>{message}</p>}
    </form>
  );
}
