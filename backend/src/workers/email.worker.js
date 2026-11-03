const nodemailer = require('nodemailer');
const env = require('../config/env');

let transporter = null;

async function getTransporter() {
  if (transporter) return transporter;

  if (env.smtp.user && env.smtp.pass) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: {
        user: env.smtp.user,
        pass: env.smtp.pass,
      },
    });
  } else {
    // Generate automatic Ethereal test inbox
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log(`[EmailWorker] Created Ethereal test inbox: ${testAccount.user}`);
    } catch (err) {
      console.warn(`[EmailWorker] Could not create Ethereal account: ${err.message}. Mocking send.`);
      transporter = {
        sendMail: async (opts) => ({ messageId: `mock_${Date.now()}`, ...opts }),
      };
    }
  }

  return transporter;
}

async function processEmailJob(payload) {
  const { to, subject, template, data } = payload;
  console.log(`[EmailWorker] Processing async email to ${to}: "${subject}" (template: ${template})`);

  let textBody = `Hello,\n\nYou have an update from DevMatch: ${subject}\n\n`;
  if (template === 'WELCOME') {
    textBody += `Welcome to DevMatch, ${data.name}! Start exploring roles and connecting with top tech teams.`;
  } else if (template === 'NEW_APPLICATION') {
    textBody += `Candidate ${data.candidateName} has applied for role "${data.roleTitle}". Check candidate deck in your dashboard.`;
  } else if (template === 'MATCH_ALERT') {
    textBody += `Great news! You have a new connection with ${data.partnerName} for "${data.roleTitle}". Open chat to start collaborating!`;
  } else {
    textBody += JSON.stringify(data, null, 2);
  }

  const transport = await getTransporter();
  const info = await transport.sendMail({
    from: env.smtp.from,
    to,
    subject,
    text: textBody,
  });

  const previewUrl = nodemailer.getTestMessageUrl ? nodemailer.getTestMessageUrl(info) : null;
  console.log(`[EmailWorker] Email sent to ${to}. MessageId: ${info.messageId}${previewUrl ? ` | Preview: ${previewUrl}` : ''}`);
  return info;
}

function startEmailWorker(channel, queueName) {
  channel.prefetch(5);
  channel.consume(
    queueName,
    async (msg) => {
      if (!msg) return;
      try {
        const payload = JSON.parse(msg.content.toString());
        await processEmailJob(payload);
        channel.ack(msg);
      } catch (err) {
        console.error(`[EmailWorker] Error processing job: ${err.message}`);
        channel.nack(msg, false, false);
      }
    },
    { noAck: false }
  );
  console.log(`[EmailWorker] Listening on queue: ${queueName}`);
}

module.exports = { startEmailWorker, processEmailJob };

