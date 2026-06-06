"use client";

import { useState } from "react";
import { useAuth } from "./AuthProvider";

export function LoginView() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === "login") {
        await login(email.trim(), password);
      } else {
        await register({
          email: email.trim(),
          password,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "İşlem başarısız oldu");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="glass-strong rounded-3xl p-8 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          {mode === "login" ? "Giriş yap" : "Hesap oluştur"}
        </h2>
        <p className="mt-1 text-sm text-muted">
          Saha yönetim paneline erişmek için kimlik doğrulaması gerekir.
        </p>

        <form onSubmit={submit} className="mt-6 flex flex-col gap-3">
          {mode === "register" && (
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Ad"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-white/40"
              />
              <input
                type="text"
                placeholder="Soyad"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-white/40"
              />
            </div>
          )}
          <input
            type="email"
            placeholder="E-posta"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-white/40"
          />
          <input
            type="password"
            placeholder={mode === "register" ? "Parola (en az 8 karakter)" : "Parola"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={mode === "register" ? 8 : undefined}
            className="rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-white/40"
          />

          {error && <p className="text-sm text-danger">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-primary-soft disabled:opacity-60"
          >
            {loading
              ? "Lütfen bekleyin…"
              : mode === "login"
                ? "Giriş yap"
                : "Kayıt ol ve gir"}
          </button>
        </form>

        <button
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setError(null);
          }}
          className="mt-4 w-full text-center text-xs text-muted transition hover:text-foreground"
        >
          {mode === "login"
            ? "Hesabın yok mu? Kayıt ol"
            : "Zaten hesabın var mı? Giriş yap"}
        </button>
      </div>
    </div>
  );
}
