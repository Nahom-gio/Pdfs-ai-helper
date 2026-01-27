"use client";

import { useState } from "react";
import { createBrowserClient } from "../lib/supabase/browser";

export default function SignOutButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignOut = async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createBrowserClient();
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        setError(signOutError.message);
      } else {
        window.location.href = "/sign-in";
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
    <div style={{ display: "grid", gap: 6, justifyItems: "end" }}>
      <button className="button secondary" onClick={handleSignOut}>
        {loading ? "Signing out..." : "Sign out"}
      </button>
      {error ? <span style={{ color: "#8a1f11" }}>{error}</span> : null}
    </div>
  );
}
