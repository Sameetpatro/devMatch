const { getChannel, QUEUES } = require('./connection');

class QueuePublisher {
  async publish(queueName, messagePayload) {
    try {
      const channel = await getChannel();
      if (channel) {
        const buffer = Buffer.from(JSON.stringify(messagePayload));
        const sent = channel.sendToQueue(queueName, buffer, {
          persistent: true,
          contentType: 'application/json',
          timestamp: Date.now(),
        });
        return sent;
      }
    } catch (err) {
      console.warn(`[QueuePublisher] Failed to publish to ${queueName}: ${err.message}`);
    }
    return false;
  }

  // 1. Asynchronous Candidate Matching Queue
  async publishCandidateMatching({ roleId, recruiterId }) {
    return this.publish(QUEUES.MATCHING, {
      roleId: Number(roleId),
      recruiterId: Number(recruiterId),
      timestamp: Date.now(),
    });
  }

  // 2. Asynchronous In-App Notifications Queue
  async publishNotification({ userId, type, title, body, data = null }) {
    return this.publish(QUEUES.NOTIFICATIONS, {
      userId: Number(userId),
      type,
      title,
      body,
      data,
      timestamp: Date.now(),
    });
  }

  // 3. Asynchronous Email Processing Queue
  async publishEmail({ to, subject, template, data = {} }) {
    return this.publish(QUEUES.EMAIL, {
      to,
      subject,
      template,
      data,
      timestamp: Date.now(),
    });
  }
}

module.exports = new QueuePublisher();

