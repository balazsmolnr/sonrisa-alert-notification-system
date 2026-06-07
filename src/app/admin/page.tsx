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

export default async function AlertsPage({ searchParams }: Props) {
  const { key } = await searchParams;

  if (!key || key !== process.env.ADMIN_API_KEY) {
    return unauthorized();
  }

  const alerts = await prisma.alert.findMany({
    include: {
      user: { select: { email: true } },
      _count: { select: { conditions: true, channels: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Alerts</h1>
      {alerts.length === 0 ? (
        <p className="text-gray-500">No alerts yet.</p>
      ) : (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100 text-left text-gray-600">
              <th className="px-4 py-2 border border-gray-200">Name</th>
              <th className="px-4 py-2 border border-gray-200">User</th>
              <th className="px-4 py-2 border border-gray-200">Status</th>
              <th className="px-4 py-2 border border-gray-200">Conditions</th>
              <th className="px-4 py-2 border border-gray-200">Channels</th>
              <th className="px-4 py-2 border border-gray-200">Created</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((alert) => (
              <tr key={alert.id} className="odd:bg-white even:bg-gray-50">
                <td className="px-4 py-2 border border-gray-200 font-medium">
                  {alert.name}
                </td>
                <td className="px-4 py-2 border border-gray-200 text-gray-600">
                  {alert.user.email}
                </td>
                <td className="px-4 py-2 border border-gray-200">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                      alert.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {alert.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-2 border border-gray-200 text-center">
                  {alert._count.conditions}
                </td>
                <td className="px-4 py-2 border border-gray-200 text-center">
                  {alert._count.channels}
                </td>
                <td className="px-4 py-2 border border-gray-200 text-gray-500">
                  {alert.createdAt.toISOString().slice(0, 10)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}