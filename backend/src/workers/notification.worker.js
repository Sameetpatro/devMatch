const notificationRepository = require('../repositories/notification.repository');

async function processNotificationJob(payload) {
  const { userId, type, title, body, data } = payload;
  console.log(`[NotificationWorker] Processing notification for user #${userId} [${type}]: "${title}"`);

  await notificationRepository.create({
    userId,
    type,
    title,
    body,
    data,
  });

  console.log(`[NotificationWorker] Notification saved to database for user #${userId}`);
}

function startNotificationWorker(channel, queueName) {
  channel.prefetch(10);
  channel.consume(
    queueName,
    async (msg) => {
      if (!msg) return;
      try {
        const payload = JSON.parse(msg.content.toString());
        await processNotificationJob(payload);
        channel.ack(msg);
      } catch (err) {
        console.error(`[NotificationWorker] Error processing job: ${err.message}`);
        channel.nack(msg, false, false);
      }
    },
    { noAck: false }
  );
  console.log(`[NotificationWorker] Listening on queue: ${queueName}`);
}

module.exports = { startNotificationWorker, processNotificationJob };

