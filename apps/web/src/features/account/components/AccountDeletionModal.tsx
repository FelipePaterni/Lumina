"use client";

import React, { useState } from "react";
import { accountApi } from "../services/account-api";

interface AccountDeletionModalProps {
  token: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AccountDeletionModal: React.FC<AccountDeletionModalProps> = ({
  token,
  onSuccess,
  onCancel,
}) => {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await accountApi.requestAccountDeletion(token, reason);
      onSuccess();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao solicitar exclusão da conta",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        border: "1px solid #ccc",
        padding: "24px",
        borderRadius: "8px",
        maxWidth: "480px",
        background: "#fff",
      }}
    >
      <h2>Solicitar exclusão de conta</h2>
      <p style={{ color: "#555" }}>
        Atenção: Ao confirmar, sua conta será imediatamente desativada. Conforme
        a regra RN-018, você terá um período de 30 dias para reativá-la caso mude
        de ideia. Após esse período, os dados serão excluídos definitivamente.
      </p>

      {error && (
        <div style={{ color: "red", marginBottom: "12px" }}>{error}</div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "16px" }}>
          <label htmlFor="reason" style={{ display: "block", marginBottom: "4px" }}>
            Motivo da solicitação (opcional):
          </label>
          <textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            style={{ width: "100%", padding: "8px" }}
            placeholder="Conte-nos por que deseja sair..."
          />
        </div>

        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            style={{ padding: "8px 16px" }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "8px 16px",
              background: "#d32f2f",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
            }}
          >
            {loading ? "Processando..." : "Confirmar Desativação"}
          </button>
        </div>
      </form>
    </div>
  );
};
