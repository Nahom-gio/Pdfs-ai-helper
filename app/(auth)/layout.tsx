import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 520 }}>
        {children}
      </div>
    </div>
  );
}