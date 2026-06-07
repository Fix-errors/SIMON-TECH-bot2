const TelegramBot = require('node-telegram-bot-api');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');

// Replace with your actual Telegram bot token
const TOKEN = process.env.TELEGRAM_BOT_TOKEN || 'YOUR_TELEGRAM_BOT_TOKEN_HERE';
const bot = new TelegramBot(TOKEN, { polling: true });

const sessionsDir = path.join(__dirname, 'sessions');
if (!fs.existsSync(sessionsDir)) {
  fs.mkdirSync(sessionsDir, { recursive: true });
}

// User data storage
const userSessions = {};
const userStates = {};

// Country code mapping
const countryMap = {
  '234': '🇳🇬 Nigeria',
  '1': '🇺🇸 United States',
  '44': '🇬🇧 United Kingdom',
  '91': '🇮🇳 India',
  '86': '🇨🇳 China',
  '81': '🇯🇵 Japan',
  '55': '🇧🇷 Brazil',
  '33': '🇫🇷 France',
  '39': '🇮🇹 Italy',
  '49': '🇩🇪 Germany',
};

function getCountry(phone) {
  for (const [code, country] of Object.entries(countryMap)) {
    if (phone.startsWith('+' + code) || phone.startsWith(code)) {
      return country;
    }
  }
  return '🌍 Unknown';
}

function formatPhoneDisplay(phone) {
  const lastDigits = phone.replace(/\D/g, '').slice(-8);
  return '****' + lastDigits;
}

// /start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const firstName = msg.from.first_name || 'User';
  const lastName = msg.from.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim();

  const welcomeMessage = `╭━━━━━━━━━━━━━━━╮
💖 𝐒𝐈𝐌𝐎𝐍 𝐓𝐄𝐂𝐇 𝐁𝐎𝐓 𝟐 💖
╰━━━━━━━━━━━━━━━╯

👋 𝐖𝐞𝐥𝐜𝐨𝐦𝐞, ${fullName}!

📱 𝐓𝐞𝐥𝐞𝐠𝐫𝐚𝐦 𝐈𝐃: ${userId}
👤 𝐍𝐚𝐦𝐞: ${fullName}

🎯 𝐔𝐬𝐞 /help 𝐭𝐨 𝐬𝐞𝐞 𝐚𝐯𝐚𝐢𝐥𝐚𝐛𝐥𝐞 𝐜𝐨𝐦𝐦𝐚𝐧𝐝𝐬`;

  bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'HTML' });
});

// /help command
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;

  const helpMessage = `╭━━━━━━━━━━━━━━━╮
💖 𝐀𝐕𝐀𝐈𝐋𝐀𝐁𝐋𝐄 𝐂𝐎𝐌𝐌𝐀𝐍𝐃𝐒 💖
╰━━━━━━━━━━━━━━━╯

📌 /start - Welcome message & user info
📌 /pair <phone_number> - Generate WhatsApp pairing code
   ➤ Example: /pair 2349166265317
📌 /help - Show this help message
📌 /ping - Check bot status
📌 /sessions - View your active sessions
📌 /cancel - Cancel current operation

📱 𝐏𝐡𝐨𝐧𝐞 𝐅𝐨𝐫𝐦𝐚𝐭:
   ➤ Include country code (no + needed)
   ➤ Example: 2349166265317 (Nigeria)
   ➤ Example: 12025551234 (USA)

❤️‍🩹 𝐒𝐈𝐌𝐎𝐍 𝐓𝐄𝐂𝐇 𝐁𝐎𝐓 𝟐`;

  bot.sendMessage(chatId, helpMessage, { parse_mode: 'HTML' });
});

// /ping command
bot.onText(/\/ping/, (msg) => {
  const chatId = msg.chat.id;
  const startTime = Date.now();

  bot.sendMessage(chatId, '🔍 𝐂𝐡𝐞𝐜𝐤𝐢𝐧𝐠 𝐛𝐨𝐭 𝐬𝐭𝐚𝐭𝐮𝐬...').then(() => {
    const responseTime = Date.now() - startTime;
    bot.sendMessage(
      chatId,
      `✅ 𝐁𝐨𝐭 𝐢𝐬 𝐀𝐂𝐓𝐈𝐕𝐄 ✅

🔌 𝐒𝐭𝐚𝐭𝐮𝐬: 𝐎𝐧𝐥𝐢𝐧𝐞
⚡ 𝐑𝐞𝐬𝐩𝐨𝐧𝐬𝐞 𝐓𝐢𝐦𝐞: ${responseTime}ms
💖 𝐁𝐨𝐭 𝐇𝐞𝐚𝐥𝐭𝐡𝐲`,
      { parse_mode: 'HTML' }
    );
  });
});

// /pair command
bot.onText(/\/pair\s+(\S+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const phoneNumber = match[1];

  // Validate phone number format
  if (!/^\d{10,15}$/.test(phoneNumber.replace(/\D/g, ''))) {
    bot.sendMessage(chatId, '❌ 𝐈𝐧𝐯𝐚𝐥𝐢𝐝 𝐩𝐡𝐨𝐧𝐞 𝐧𝐮𝐦𝐛𝐞𝐫 𝐟𝐨𝐫𝐦𝐚𝐭\n\n📌 𝐏𝐥𝐞𝐚𝐬𝐞 𝐮𝐬𝐞: /pair <country_code><number>\n𝐄𝐱𝐚𝐦𝐩𝐥𝐞: /pair 2349166265317', { parse_mode: 'HTML' });
    return;
  }

  // Format phone number
  let formattedPhone = phoneNumber;
  if (!formattedPhone.startsWith('+')) {
    formattedPhone = '+' + formattedPhone;
  }

  const country = getCountry(formattedPhone);

  // Send generating message
  const generatingMsg = await bot.sendMessage(
    chatId,
    `╭━━━━━━━━━━━━━━━╮
💖 𝐒𝐈𝐌𝐎𝐍 𝐓𝐄𝐂𝐇 𝐁𝐎𝐓 𝟐 💖
╰━━━━━━━━━━━━━━━╯

⏳ 𝐆𝐞𝐧𝐞𝐫𝐚𝐭𝐢𝐧𝐠 𝐏𝐚𝐢𝐫 𝐂���𝐝𝐞...

📱 𝐍𝐮𝐦𝐛𝐞𝐫: ${formattedPhone}
${country}

🔄 𝐏𝐥𝐞𝐚𝐬𝐞 𝐰𝐚𝐢𝐭 𝐚 𝐦𝐨𝐦𝐞𝐧𝐭...`,
    { parse_mode: 'HTML' }
  );

  try {
    // Generate session
    const sessionId = `SIMON_${userId}_${Date.now()}`;
    const sessionPath = path.join(sessionsDir, sessionId);

    if (!fs.existsSync(sessionPath)) {
      fs.mkdirSync(sessionPath, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
    });

    let pairingCodeGenerated = false;

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect } = update;

      if (connection === 'open') {
        userSessions[userId] = {
          sessionId,
          phoneNumber: formattedPhone,
          connected: true,
          timestamp: Date.now(),
        };

        try {
          await new Promise(resolve => setTimeout(resolve, 1000));
          const credentialsPath = path.join(sessionPath, 'creds.json');
          if (fs.existsSync(credentialsPath)) {
            const credentials = fs.readFileSync(credentialsPath, 'utf-8');
            const encodedSession = Buffer.from(credentials).toString('base64');

            await bot.editMessageText(
              `╭━━━━━━━━━━━━━━━╮
♡ 𝐒𝐈𝐌𝐎𝐍 𝐓𝐄𝐂𝐇 𝐁𝐎𝐓 𝟐 👀
╰━━━━━━━━━━━━━━━╯

╰┈➤ ɴᴜᴍʙᴇʀ : ${formattedPhone}

╰┈➤ ᴄᴏᴜɴᴛʀʏ : ${country}

╰┈➤ ʙʀᴀɴᴅ : SIMO-TECH

╰┈➤ ᴘᴀɪʀ ᴄᴏᴅᴇ : ✅ 𝐒𝐮𝐜𝐜𝐞𝐬𝐬

[ ✅ 𝐒𝐄𝐒𝐒𝐈𝐎𝐍 𝐂𝐎𝐍𝐍𝐄𝐂𝐓𝐄𝐃 ✅ ]

🔐 𝐒𝐄𝐒𝐒𝐈𝐎𝐍 𝐈𝐃:
<code>${encodedSession}</code>

📋 𝐔𝐬𝐞 /sessions 𝐭𝐨 𝐯𝐢𝐞𝐰 𝐲𝐨𝐮𝐫 𝐚𝐜𝐭𝐢𝐯𝐞 𝐬𝐞𝐬𝐬𝐢𝐨𝐧𝐬`,
              { chat_id: chatId, message_id: generatingMsg.message_id, parse_mode: 'HTML' }
            );
          }
        } catch (err) {
          console.error('Error reading credentials:', err);
        }

        sock.end();
      }

      if (connection === 'close') {
        const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
        if (!shouldReconnect && !pairingCodeGenerated) {
          sock.end();
        }
      }
    });

    // Wait for socket ready and request pairing code
    await new Promise(resolve => {
      const checkReady = setInterval(() => {
        if (sock.authState && sock.authState.creds) {
          clearInterval(checkReady);
          resolve();
        }
      }, 100);
      setTimeout(() => clearInterval(checkReady), 10000);
    });

    try {
      if (!sock.authState.creds.registered) {
        const code = await sock.requestPairingCode(formattedPhone);
        pairingCodeGenerated = true;

        // Format code with dashes (XXXX-XXXX format)
        const formattedCode = code ? code.replace(/(.{4})/g, '$1-').slice(0, -1) : 'ERROR';

        await bot.editMessageText(
          `╭━━━━━━━━━━━━━━━╮
💖 𝐒𝐈𝐌𝐎𝐍 𝐓𝐄𝐂𝐇 𝐁𝐎𝐓 𝟐 💖
╰━━━━━━━━━━━━━━━╯

✅ 𝐏𝐚𝐢𝐫 𝐂𝐨𝐝𝐞 𝐆𝐞𝐧𝐞𝐫𝐚𝐭𝐞𝐝

📱 𝐍𝐮𝐦𝐛𝐞𝐫: ${formattedPhone}
${country}

🔑 𝐂𝐨𝐝𝐞: <code>${formattedCode}</code>

📲 𝐄𝐧𝐭𝐞𝐫 𝐭𝐡𝐢𝐬 𝐜𝐨𝐝𝐞 𝐢𝐧 𝐖𝐡𝐚𝐭𝐬𝐀𝐩𝐩
❤️‍🩹 𝐒𝐞𝐬𝐬𝐢𝐨𝐧 𝐂𝐨𝐧𝐧𝐞𝐜𝐭𝐢𝐧𝐠...`,
          { chat_id: chatId, message_id: generatingMsg.message_id, parse_mode: 'HTML' }
        );

        userStates[userId] = {
          waitingForSession: true,
          phoneNumber: formattedPhone,
          sessionId,
          socket: sock,
          timestamp: Date.now(),
        };

        // Store session info
        userSessions[userId] = {
          sessionId,
          phoneNumber: formattedPhone,
          pairingCode: formattedCode,
          connected: false,
          timestamp: Date.now(),
        };
      }
    } catch (codeError) {
      console.error('Error requesting pairing code:', codeError);
      await bot.editMessageText(
        `❌ 𝐄𝐫𝐫𝐨𝐫 𝐠𝐞𝐧𝐞𝐫𝐚𝐭𝐢𝐧𝐠 𝐩𝐚𝐢𝐫𝐢𝐧𝐠 𝐜𝐨𝐝𝐞

𝐏𝐥𝐞𝐚𝐬𝐞 𝐜𝐡𝐞𝐜𝐤:
• 𝐏𝐡𝐨𝐧𝐞 𝐧𝐮𝐦𝐛𝐞𝐫 𝐟𝐨𝐫𝐦𝐚𝐭
• 𝐖𝐡𝐚𝐭𝐬𝐀𝐩𝐩 𝐢𝐬 𝐢𝐧𝐬𝐭𝐚𝐥𝐥𝐞𝐝
• 𝐘𝐨𝐮𝐫 𝐢𝐧𝐭𝐞𝐫𝐧𝐞𝐭 𝐜𝐨𝐧𝐧𝐞𝐜𝐭𝐢𝐨𝐧`,
        { chat_id: chatId, message_id: generatingMsg.message_id, parse_mode: 'HTML' }
      );
    }

    sock.ev.on('creds.update', saveCreds);
  } catch (error) {
    console.error('Error generating session:', error);
    await bot.editMessageText(
      `❌ 𝐄𝐫𝐫𝐨𝐫: ${error.message}`,
      { chat_id: chatId, message_id: generatingMsg.message_id, parse_mode: 'HTML' }
    );
  }
});

// /sessions command
bot.onText(/\/sessions/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (userSessions[userId]) {
    const session = userSessions[userId];
    const sessionsMessage = `╭━━━━━━━━━━━━━━━╮
💖 𝐀𝐂𝐓𝐈𝐕𝐄 𝐒𝐄𝐒𝐒𝐈𝐎𝐍𝐒 💖
╰━━━━━━━━━━━━━━━╯

📱 𝐏𝐡𝐨𝐧𝐞: ${session.phoneNumber}
🔐 𝐒𝐞𝐬𝐬𝐢𝐨𝐧 𝐈𝐃: ${session.sessionId}
${session.pairingCode ? `🔑 𝐂𝐨𝐝𝐞: ${session.pairingCode}` : ''}
${session.connected ? '✅ 𝐒𝐭𝐚𝐭𝐮𝐬: 𝐂𝐨𝐧𝐧𝐞𝐜𝐭𝐞𝐝' : '⏳ 𝐒𝐭𝐚𝐭𝐮𝐬: 𝐏𝐞𝐧𝐝𝐢𝐧𝐠'}`;

    bot.sendMessage(chatId, sessionsMessage, { parse_mode: 'HTML' });
  } else {
    bot.sendMessage(
      chatId,
      '❌ 𝐍𝐨 𝐚𝐜𝐭𝐢𝐯𝐞 𝐬𝐞𝐬𝐬𝐢𝐨𝐧𝐬\n\n📌 𝐔𝐬𝐞 /pair <phone_number> 𝐭𝐨 𝐠𝐞𝐧𝐞𝐫𝐚𝐭𝐞 𝐚 𝐧𝐞𝐰 𝐬𝐞𝐬𝐬𝐢𝐨𝐧',
      { parse_mode: 'HTML' }
    );
  }
});

// /cancel command
bot.onText(/\/cancel/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (userStates[userId]) {
    if (userStates[userId].socket) {
      userStates[userId].socket.end();
    }
    delete userStates[userId];
    bot.sendMessage(chatId, '✅ 𝐎𝐩𝐞𝐫𝐚𝐭𝐢𝐨𝐧 𝐜𝐚𝐧𝐜𝐞𝐥𝐞𝐝', { parse_mode: 'HTML' });
  } else {
    bot.sendMessage(chatId, '❌ 𝐍𝐨 𝐚𝐜𝐭𝐢𝐯𝐞 𝐨𝐩𝐞𝐫𝐚𝐭𝐢𝐨𝐧 𝐭𝐨 𝐜𝐚𝐧𝐜𝐞𝐥', { parse_mode: 'HTML' });
  }
});

// Handle unknown commands
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text || '';

  // Skip if it's a recognized command
  if (text.startsWith('/')) {
    const command = text.split(' ')[0];
    if (['/start', '/help', '/ping', '/pair', '/sessions', '/cancel'].includes(command)) {
      return;
    }

    // Unknown command
    bot.sendMessage(
      chatId,
      `❌ 𝐔𝐧𝐤𝐧𝐨𝐰𝐧 𝐜𝐨𝐦𝐦𝐚𝐧𝐝: ${command}\n\n📌 𝐔𝐬𝐞 /help 𝐭𝐨 𝐬𝐞𝐞 𝐚𝐯𝐚𝐢𝐥𝐚𝐛𝐥𝐞 𝐜𝐨𝐦𝐦𝐚𝐧𝐝𝐬`,
      { parse_mode: 'HTML' }
    );
  }
});

console.log('╭━━━━━━━━━━━━━━━╮');
console.log('💖 𝐒𝐈𝐌𝐎𝐍 𝐓𝐄𝐂𝐇 𝐓𝐄𝐋𝐄𝐆𝐑𝐀𝐌 𝐁𝐎𝐓 𝟐 💖');
console.log('╰━━━━━━━━━━━━━━━╯');
console.log('🚀 Bot is running...');
console.log('📌 Bot Token:', TOKEN ? '✅ Configured' : '❌ Missing');
console.log('⏱️ Polling enabled for commands\n');

// Handle bot errors
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

module.exports = bot;
