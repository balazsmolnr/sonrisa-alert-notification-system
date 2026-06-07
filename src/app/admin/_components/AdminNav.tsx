"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export function AdminNav() {
  const params = useSearchParams();
  const key = params.get("key");
  const q = key ? `?key=${key}` : "";

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex gap-6 text-sm font-medium">
      <span className="text-gray-400 font-semibold tracking-wide uppercase text-xs self-center mr-2">
        Admin
      </span>
      <Link href={`/admin${q}`} className="text-gray-700 hover:text-black">
        Alerts
      </Link>
      <Link href={`/admin/logs${q}`} className="text-gray-700 hover:text-black">
        Delivery Log
      </Link>
      <Link href={`/admin/users${q}`} className="text-gray-700 hover:text-black">
        Users
      </Link>
    </nav>
  );
}

export function AdminNavFallback() {
  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex gap-6 text-sm font-medium">
      <span className="text-gray-400 font-semibold tracking-wide uppercase text-xs self-center mr-2">
        Admin
      </span>
    </nav>
  );
}