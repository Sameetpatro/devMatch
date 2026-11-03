const { getChannel, QUEUES } = require('../queues/connection');
const { startMatchingWorker } = require('./matching.worker');
const { startNotificationWorker } = require('./notification.worker');
const { startEmailWorker } = require('./email.worker');

async function startWorkers() {
  console.log('[Workers] Initializing RabbitMQ background consumers...');
  try {
    const channel = await getChannel();
    if (!channel) {
      console.warn('[Workers] RabbitMQ channel unavailable. Workers paused until connection restores.');
      return;
    }

    startMatchingWorker(channel, QUEUES.MATCHING);
    startNotificationWorker(channel, QUEUES.NOTIFICATIONS);
    startEmailWorker(channel, QUEUES.EMAIL);

    console.log('[Workers] All RabbitMQ workers successfully running.');
  } catch (err) {
    console.error(`[Workers] Error starting workers: ${err.message}`);
  }
}

if (require.main === module) {
  startWorkers();
}

module.exports = { startWorkers };

