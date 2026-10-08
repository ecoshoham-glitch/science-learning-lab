import Link from "next/link";

/** Not-found for paths outside any locale. */
export default function GlobalNotFound() {
  return (
    <html lang="he" dir="rtl">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "2rem" }}>
        <h1>404</h1>
        <p>
          <Link href="/he">מעבדת המדע</Link> · <Link href="/en">Science Learning Lab</Link>
        </p>
      </body>
    </html>
  );
}
