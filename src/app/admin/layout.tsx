import Link from "next/link";

type Props = {
  children: React.ReactNode;
  searchParams: Promise<{ key?: string }>;
};

export default async function AdminLayout({ children, searchParams }: Props) {
  const { key = "" } = await searchParams;
  const q = key ? `?key=${key}` : "";

  return (
    <div className="min-h-screen bg-gray-50">
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
      <main className="px-6 py-8">{children}</main>
    </div>
  );
}