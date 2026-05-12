const twilio = require('twilio');

/**
 * Sends an SMS notification to a patient.
 * Falls back to console logging if Twilio credentials are missing in .env.
 */
const sendNotification = async (to, message) => {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;

  if (!sid || !token || !from) {
    console.log('\x1b[33m%s\x1b[0m', '--- NOTIFICATION MOCK ---');
    console.log(`To: ${to}`);
    console.log(`Message: ${message}`);
    console.log('\x1b[33m%s\x1b[0m', '-------------------------');
    return;
  }

  try {
    const client = twilio(sid, token);
    await client.messages.create({
      body: message,
      from: from,
      to: to
    });
    console.log(`Twilio: SMS sent successfully to ${to}`);
  } catch (error) {
    console.error('Twilio Error:', error.message);
  }
};

module.exports = {
  sendNotification
};
