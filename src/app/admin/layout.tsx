import { Suspense } from "react";
import { AdminNav, AdminNavFallback } from "./_components/AdminNav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<AdminNavFallback />}>
        <AdminNav />
      </Suspense>
      <main className="px-6 py-8">{children}</main>
    </div>
  );
}