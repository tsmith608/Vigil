"use client";

import Link from "next/link";

export default function Header() {
  return (
    <header
      className="
        science
        fixed top-0 left-0 w-full 
        z-50
        flex items-center justify-between
        px-8 py-4
        pointer-events-auto
        text-white
      "
      style={{ background: "transparent" }}
    >
      {/* Left side title */}
      <Link href="/" className="text-xl font-bold tracking-wide">
        Vigil
      </Link>

      {/* Right side nav */}
      <nav className="flex space-x-8 text-sm">
        <Link href="/about" className="hover:text-blue-300 transition">
          About
        </Link>
        <Link href="/faq" className="hover:text-blue-300 transition">
          FAQ
        </Link>
      </nav>
    </header>
  );
}
