"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { apiRequest } from "./api";

function InvitationForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [complete, setComplete] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const password = String(data.get("password") ?? "");
    const confirmation = String(data.get("confirmation") ?? "");
    if (!token) {
      setError("O link de ativação está incompleto.");
      return;
    }
    if (password !== confirmation) {
      setError("As senhas não coincidem.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await apiRequest<{ message: string }>(
        "/auth/accept-invitation",
        {
          method: "POST",
          body: { token, newPassword: password },
        },
      );
      setNotice(result.message);
      setComplete(true);
      router.replace("/ativar-equipe");
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível ativar a conta.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (complete) {
    return (
      <main className="page-shell auth-wrap">
        <section className="form-card">
          <h1>Conta ativada</h1>
          <p role="status">{notice}</p>
          <Link className="button-link" href="/dashboard">
            Entrar na área da equipe
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell auth-wrap">
      <header className="page-heading">
        <p className="eyebrow">CONTA DA EQUIPE</p>
        <h1>Ativar acesso</h1>
        <p>
          Defina uma senha para concluir o convite. O link é válido por 24 horas
          e pode ser usado uma vez.
        </p>
      </header>
      <form className="form-card" onSubmit={(event) => void submit(event)}>
        <label>
          Nova senha
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={12}
            required
          />
        </label>
        <label>
          Confirme a senha
          <input
            name="confirmation"
            type="password"
            autoComplete="new-password"
            minLength={12}
            required
          />
        </label>
        <button type="submit" disabled={busy || !token}>
          {busy ? "Ativando…" : "Ativar conta"}
        </button>
        {error && (
          <p role="alert" className="error-text">
            {error}
          </p>
        )}
        {notice && <p role="status">{notice}</p>}
        {!token && (
          <p role="alert" className="error-text">
            Token de convite ausente.
          </p>
        )}
      </form>
    </main>
  );
}

export function StaffInvitationPage() {
  return (
    <Suspense
      fallback={
        <main className="page-shell">
          <p role="status">Carregando convite…</p>
        </main>
      }
    >
      <InvitationForm />
    </Suspense>
  );
}
