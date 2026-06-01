import { Expo } from 'expo-server-sdk';
import { prisma } from './prisma.js';

// Create a new Expo SDK client
// optionally providing an access token if you have enabled push security
const expo = new Expo();

export interface PushMessage {
  userId: string;
  title: string;
  body: string;
  data?: any;
}

export class PushService {
  static async sendNotification(message: PushMessage) {
    try {
      // Get user's push token
      const user = await prisma.user.findUnique({
        where: { id: message.userId },
        select: { pushToken: true },
      });

      if (!user || !user.pushToken) {
        console.log(`[PushService] User ${message.userId} has no pushToken. Skipping notification.`);
        return;
      }

      if (!Expo.isExpoPushToken(user.pushToken) || user.pushToken.startsWith('Error:')) {
        console.warn(`[PushService] User ${message.userId} has an invalid push token. Skipping push notification.`);
        return;
      }

      const messages = [{
        to: user.pushToken,
        sound: 'default',
        title: message.title,
        body: message.body,
        data: message.data || {},
      }];

      // The Expo push service accepts batches of notifications so
      // that you don't need to send 1000 requests to send 1000 notifications. We
      // recommend you batch your notifications to reduce the number of requests
      // and to compress them (notifications with similar content will get
      // compressed).
      let chunks = expo.chunkPushNotifications(messages as any);
      
      const tickets = [];
      for (let chunk of chunks) {
        try {
          let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
          // NOTE: If a ticket contains an error code in ticket.details.error, you
          // must handle it appropriately. The error codes are listed in the Expo
          // documentation:
          // https://docs.expo.io/push-notifications/sending-notifications/#individual-errors
        } catch (error) {
          console.error('[PushService] Error sending chunk', error);
        }
      }
      
      console.log(`[PushService] Sent notification to user ${message.userId} successfully`);
    } catch (error) {
      console.error('[PushService] Error sending push notification:', error);
    }
  }
}
