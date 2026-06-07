import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "test@example.com" },
    update: { apiKey: "test-api-key-123" },
    create: {
      email: "test@example.com",
      name: "Test User",
      apiKey: "test-api-key-123",
    },
  });

  console.log("Upserted user:", user.email, "| apiKey:", user.apiKey);

  // Delete existing seed alert to keep the script idempotent
  await prisma.alert.deleteMany({
    where: { userId: user.id, name: "Earthquake Alert" },
  });

  const alert = await prisma.alert.create({
    data: {
      userId: user.id,
      name: "Earthquake Alert",
      isActive: true,
      conditions: {
        create: [{ type: "keyword", value: "earthquake" }],
      },
      channels: {
        create: [
          {
            channelType: "slack",
            config: {
              webhookUrl: "https://hooks.slack.com/services/PLACEHOLDER",
            },
          },
        ],
      },
    },
    include: { conditions: true, channels: true },
  });

  console.log("Created alert:", alert.name);
  console.log("  condition:", alert.conditions[0].type, "=", alert.conditions[0].value);
  console.log("  channel:", alert.channels[0].channelType);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });