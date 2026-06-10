import Redis from "ioredis";
import prisma from "@/shared/db/prisma";

const NOTIFICATION_CHANNEL = "notification:new";

let publisher: Redis | null = null;

function getPublisher(): Redis {
  if (!publisher) {
    const url = process.env.REDIS_URL;
    if (!url) throw new Error("REDIS_URL is not defined");
    publisher = new Redis(url, { lazyConnect: true, enableOfflineQueue: false });
  }
  return publisher;
}

export async function publishNotification({
  userId,
  type,
  message,
}: {
  userId: string;
  type: string;
  message: string;
}) {
  const notification = await prisma.notification.create({
    data: { userId, type, message },
  });

  try {
    const pub = getPublisher();
    await pub.publish(
      NOTIFICATION_CHANNEL,
      JSON.stringify({
        userId,
        id: notification.id,
        type: notification.type,
        message: notification.message,
        createdAt: notification.createdAt.toISOString(),
      }),
    );
  } catch {
    // Redis publish failure is non-fatal — notification is already in DB
  }

  return notification;
}
