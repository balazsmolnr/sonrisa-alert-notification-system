import { prisma } from "@/lib/prisma";

type Props = {
  searchParams: Promise<{ key?: string }>;
};

function unauthorized() {
  return (
    <p className="text-red-600 font-medium">
      Unauthorized. Append <code>?key=YOUR_ADMIN_KEY</code> to the URL.
    </p>
  );
}

export default async function UsersPage({ searchParams }: Props) {
  const { key } = await searchParams;

  if (!key || key !== process.env.ADMIN_API_KEY) {
    return unauthorized();
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { alerts: true } } },
  });

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Users</h1>
      {users.length === 0 ? (
        <p className="text-gray-500">No users yet.</p>
      ) : (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100 text-left text-gray-600">
              <th className="px-4 py-2 border border-gray-200">Name</th>
              <th className="px-4 py-2 border border-gray-200">Email</th>
              <th className="px-4 py-2 border border-gray-200">API Key</th>
              <th className="px-4 py-2 border border-gray-200">Alerts</th>
              <th className="px-4 py-2 border border-gray-200">Created</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const masked = "••••••••" + user.apiKey.slice(-8);
              return (
                <tr key={user.id} className="odd:bg-white even:bg-gray-50">
                  <td className="px-4 py-2 border border-gray-200 font-medium">
                    {user.name ?? "—"}
                  </td>
                  <td className="px-4 py-2 border border-gray-200 text-gray-700">
                    {user.email}
                  </td>
                  <td className="px-4 py-2 border border-gray-200 font-mono text-gray-500 text-xs">
                    {masked}
                  </td>
                  <td className="px-4 py-2 border border-gray-200 text-center">
                    {user._count.alerts}
                  </td>
                  <td className="px-4 py-2 border border-gray-200 text-gray-500">
                    {user.createdAt.toISOString().slice(0, 10)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
