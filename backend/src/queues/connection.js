const amqp = require('amqplib');
const env = require('../config/env');

const QUEUES = {
  MATCHING: 'devmatch.candidate_matching',
  NOTIFICATIONS: 'devmatch.notifications',
  EMAIL: 'devmatch.email_processing',
};

let connection = null;
let channel = null;
let isConnecting = false;

async function connectRabbitMQ() {
  if (channel) return channel;
  if (isConnecting) {
    // Wait for ongoing connection attempt
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 100));
      if (channel) return channel;
    }
  }

  isConnecting = true;
  try {
    connection = await amqp.connect(env.rabbitmqUrl);
    channel = await connection.createChannel();

    connection.on('error', (err) => {
      console.warn(`[RabbitMQ] Connection error: ${err.message}`);
      channel = null;
      connection = null;
    });

    connection.on('close', () => {
      console.warn('[RabbitMQ] Connection closed, will reconnect on next call');
      channel = null;
      connection = null;
    });

    // Assert durable queues
    for (const q of Object.values(QUEUES)) {
      await channel.assertQueue(q, {
        durable: true,
      });
    }

    console.log('[RabbitMQ] Connected and queues asserted successfully');
    isConnecting = false;
    return channel;
  } catch (err) {
    isConnecting = false;
    console.warn(`[RabbitMQ] Failed to connect (${err.message}). Background jobs will be deferred or in-memory.`);
    return null;
  }
}

async function getChannel() {
  if (!channel) {
    return connectRabbitMQ();
  }
  return channel;
}

module.exports = {
  QUEUES,
  getChannel,
  connectRabbitMQ,
};

