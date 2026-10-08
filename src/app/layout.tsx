/**
 * The real root layout (with <html lang dir>) lives in app/[locale]/layout.tsx.
 * This pass-through exists so the bare "/" route can redirect without a proxy/middleware,
 * which keeps the site portable across hosts (see docs/DEPLOYMENT.md).
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
