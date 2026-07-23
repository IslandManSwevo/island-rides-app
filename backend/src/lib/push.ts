import { Expo, type ExpoPushMessage } from 'expo-server-sdk';
import { prisma } from './prisma.js';
import { env } from '../config/env.js';

/**
 * Expo push notifications (design/04-backend-architecture.md). Sends to all of
 * a user's registered device tokens. Degrades gracefully — with no tokens (or
 * no EXPO_ACCESS_TOKEN) it no-ops, matching the R2/jobs pattern, so local dev
 * and unconfigured environments still work.
 */
const expo = new Expo(env.EXPO_ACCESS_TOKEN ? { accessToken: env.EXPO_ACCESS_TOKEN } : {});

export async function sendToUser(
  userId: string,
  payload: { title: string; body: string; data?: Record<string, unknown> }
): Promise<void> {
  const tokens = await prisma.pushToken.findMany({ where: { userId } });
  const messages: ExpoPushMessage[] = tokens
    .filter((t) => Expo.isExpoPushToken(t.token))
    .map((t) => ({
      to: t.token,
      sound: 'default',
      title: payload.title,
      body: payload.body,
      data: payload.data ?? {},
    }));
  if (messages.length === 0) return;

  try {
    for (const chunk of expo.chunkPushNotifications(messages)) {
      await expo.sendPushNotificationsAsync(chunk);
    }
  } catch {
    // Push is best-effort; never let a failed send break the request path.
  }
}
