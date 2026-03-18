import Link from "next/link";
import { ThemeToggle } from "@/components/chrome/theme-toggle";

const navItems = [
  { href: "/onboarding", label: "Profile" },
  { href: "/scholarships", label: "Scholarships" },
  { href: "/library", label: "Answer Library" },
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link className="brand-lockup" href="/">
          <span className="brand-mark" aria-hidden="true">
            SC
          </span>
          <span className="brand-copy">
            <strong>Scholarship Copilot</strong>
            <span>Build stronger applications from your saved story.</span>
          </span>
        </Link>

        <div className="site-header-actions">
          <nav className="site-nav" aria-label="Primary">
            {navItems.map((item) => (
              <Link key={item.href} className="site-nav-link" href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
