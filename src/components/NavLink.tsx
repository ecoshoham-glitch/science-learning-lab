"use client";

import { Link, usePathname } from "@/i18n/navigation";

export function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + "/");
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={
        "inline-flex items-center min-h-11 px-3 rounded-lg no-underline font-semibold " +
        (active ? "bg-leaf-tint text-leaf-dark" : "text-ink hover:bg-paper")
      }
    >
      {children}
    </Link>
  );
}
