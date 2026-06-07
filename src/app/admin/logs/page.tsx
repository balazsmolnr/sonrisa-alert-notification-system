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

export default async function DeliveryLogPage({ searchParams }: Props) {
  const { key } = await searchParams;

  if (!key || key !== process.env.ADMIN_API_KEY) {
    return unauthorized();
  }

  const logs = await prisma.notificationLog.findMany({
    take: 100,
    orderBy: { sentAt: "desc" },
    include: {
      alert: { select: { name: true } },
      event: { select: { headline: true } },
    },
  });

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Delivery Log</h1>
      {logs.length === 0 ? (
        <p className="text-gray-500">No logs yet.</p>
      ) : (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100 text-left text-gray-600">
              <th className="px-4 py-2 border border-gray-200">Sent at</th>
              <th className="px-4 py-2 border border-gray-200">Alert</th>
              <th className="px-4 py-2 border border-gray-200">Event</th>
              <th className="px-4 py-2 border border-gray-200">Channel</th>
              <th className="px-4 py-2 border border-gray-200">Status</th>
              <th className="px-4 py-2 border border-gray-200">Error</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="odd:bg-white even:bg-gray-50">
                <td className="px-4 py-2 border border-gray-200 text-gray-500 whitespace-nowrap">
                  {log.sentAt.toISOString().slice(0, 19).replace("T", " ")}
                </td>
                <td className="px-4 py-2 border border-gray-200 font-medium">
                  {log.alert.name}
                </td>
                <td
                  className="px-4 py-2 border border-gray-200 text-gray-700 max-w-xs truncate"
                  title={log.event.headline}
                >
                  {log.event.headline}
                </td>
                <td className="px-4 py-2 border border-gray-200 text-gray-600">
                  {log.channelType}
                </td>
                <td className="px-4 py-2 border border-gray-200">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                      log.status === "sent"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {log.status}
                  </span>
                </td>
                <td
                  className="px-4 py-2 border border-gray-200 text-gray-500 max-w-xs truncate"
                  title={log.errorMessage ?? undefined}
                >
                  {log.errorMessage
                    ? log.errorMessage.slice(0, 60) +
                      (log.errorMessage.length > 60 ? "…" : "")
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
