"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "../lib/supabase/browser";

type AuthMode = "sign-in" | "sign-up";

type AuthFormProps = {
  mode: AuthMode;
};

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const supabase = createBrowserClient();

      if (mode === "sign-in") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          setError(signInError.message);
        } else {
          router.push("/dashboard");
        }
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) {
          setError(signUpError.message);
        } else {
          setMessage("Check your email for a confirmation link.");
        }
      }
    } catch (caught) {
      const messageText =
        caught instanceof Error ? caught.message : "Something went wrong.";
      setError(messageText);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="panel stack" onSubmit={handleSubmit}>
      <div className="stack" style={{ gap: 6 }}>
        <h1>{mode === "sign-in" ? "Welcome back" : "Create your account"}</h1>
        <p className="muted">
          {mode === "sign-in"
            ? "Sign in to continue working on your documents."
            : "Start uploading PDFs and generating study materials."}
        </p>
      </div>
      <label className="stack" style={{ gap: 8 }}>
        <span>Email</span>
        <input
          className="input"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>
      <label className="stack" style={{ gap: 8 }}>
        <span>Password</span>
        <input
          className="input"
          type="password"
          autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>
      {error ? <p style={{ color: "#8a1f11" }}>{error}</p> : null}
      {message ? <p style={{ color: "#1f4f3a" }}>{message}</p> : null}
      <button className="button" type="submit" disabled={loading}>
        {loading
          ? "Working..."
          : mode === "sign-in"
          ? "Sign in"
          : "Create account"}
      </button>
    </form>
  );
}