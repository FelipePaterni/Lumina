"use client";

import React, { useState } from "react";
import { accountApi } from "../services/account-api";

interface UserProfileViewProps {
  token: string;
  user: {
    id: string;
    email: string;
    role: string;
    isActive: boolean;
    deactivatedAt?: string | null;
  };
  onAccountStatusChange: () => void;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  token,
  user,
  onAccountStatusChange,
}) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleReactivate = async () => {
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const res = await accountApi.reactivateAccount(token);
      setMessage(res.message);
      onAccountStatusChange();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Erro ao reativar a conta",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "16px", border: "1px solid #e0e0e0", borderRadius: "8px" }}>
      <h2>Perfil do Usuário</h2>
      <p>
        <strong>E-mail:</strong> {user.email}
      </p>
      <p>
        <strong>Papel:</strong> {user.role}
      </p>
      <p>
        <strong>Status:</strong>{" "}
        {user.isActive ? (
          <span style={{ color: "green" }}>Ativo</span>
        ) : (
          <span style={{ color: "orange" }}>Desativação Solicitada</span>
        )}
      </p>

      {user.deactivatedAt && (
        <p style={{ color: "#777", fontSize: "0.9rem" }}>
          Desativado em: {new Date(user.deactivatedAt).toLocaleString()}
        </p>
      )}

      {message && <div style={{ color: "green", margin: "8px 0" }}>{message}</div>}
      {error && <div style={{ color: "red", margin: "8px 0" }}>{error}</div>}

      {!user.isActive && (
        <button
          onClick={handleReactivate}
          disabled={loading}
          style={{
            padding: "8px 16px",
            background: "#2e7d32",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          {loading ? "Reativando..." : "Cancelar Exclusão e Reativar Conta"}
        </button>
      )}
    </div>
  );
};
