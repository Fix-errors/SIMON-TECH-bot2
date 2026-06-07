const TelegramBot = require('node-telegram-bot-api');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');

// Telegram Bot Setup
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
  '234': { flag: '🇳🇬', name: 'Nigeria' },
  '1': { flag: '🇺🇸', name: 'United States' },
  '44': { flag: '🇬🇧', name: 'United Kingdom' },
  '91': { flag: '🇮🇳', name: 'India' },
  '86': { flag: '🇨🇳', name: 'China' },
  '81': { flag: '🇯🇵', name: 'Japan' },
  '55': { flag: '🇧🇷', name: 'Brazil' },
  '33': { flag: '🇫🇷', name: 'France' },
  '39': { flag: '🇮🇹', name: 'Italy' },
  '49': { flag: '🇩🇪', name: 'Germany' },
};

function getCountry(phone) {
  for (const [code, data] of Object.entries(countryMap)) {
    if (phone.startsWith('+' + code) || phone.startsWith(code)) {
      return `${data.flag} ${data.name}`;
    }
  }
  return '🌍 Country unknown';
}

function formatPhoneDisplay(phone) {
  const lastDigits = phone.replace(/\D/g, '').slice(-8);
  return '****' + lastDigits;
}

// /start command
bot.onText(/^\/start$/i, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const firstName = msg.from.first_name || 'User';
  const lastName = msg.from.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim();

  const welcomeMessage = `╔════════════════════════╗
║ 💖 SIMON TECH BOT 2 💖 ║
╚════════════════════════╝

👋 Welcome, ${fullName}!

📱 Your Telegram ID: <code>${userId}</code>
👤 Name: ${fullName}

🎯 Use /help to see available commands`;

  bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'HTML' });
});

// /help command
bot.onText(/^\/help$/i, (msg) => {
  const chatId = msg.chat.id;

  const helpMessage = `╔════════════════════════╗
║ 📌 AVAILABLE COMMANDS  ║
╚════════════════════════╝

/start - Welcome message & your info
/pair <phone> - Generate WhatsApp pairing code
/help - Show this help message
/ping - Check bot status
/sessions - View your active sessions
/cancel - Cancel current operation

📱 Phone Format:
   • Include country code
   • Example: 2349166265317 (Nigeria)
   • Example: 12025551234 (USA)

❤️‍🩹 SIMON TECH BOT 2`;

  bot.sendMessage(chatId, helpMessage, { parse_mode: 'HTML' });
});

// /ping command
bot.onText(/^\/ping$/i, (msg) => {
  const chatId = msg.chat.id;
  const startTime = Date.now();

  bot.sendMessage(chatId, '🔍 Checking bot status...').then(() => {
    const responseTime = Date.now() - startTime;
    bot.sendMessage(
      chatId,
      `✅ Bot is ACTIVE ✅

🔌 Status: Online
⚡ Response Time: ${responseTime}ms
💖 Bot is Healthy`,
      { parse_mode: 'HTML' }
    );
  }).catch(err => {
    console.error('Error in ping command:', err);
  });
});

// /pair command
bot.onText(/^\/pair\s+(\S+)$/i, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const phoneNumber = match[1];

  // Validate phone number format
  if (!/^\d{10,15}$/.test(phoneNumber.replace(/\D/g, ''))) {
    bot.sendMessage(chatId, '❌ Invalid phone number format\n\n📌 Please use: /pair <country_code><number>');
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
    `⏳ Generating Pair Code...

📱 Number: ${formattedPhone}
${country}

🔄 Please wait a moment...`
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
              `[ ♡ SESSION CONNECTED ❤️‍🩹 ]

╰┈➤ Number: ${formattedPhone}

╰┈➤ Country: ${country}

╰┈➤ Brand: SIMON-TECH

🔐 Your Session ID (Base64):
<code>${encodedSession}</code>

📋 Use /sessions to view your sessions`,
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

        // Format code (8 digits)
        const formattedCode = code || 'ERROR';

        await bot.editMessageText(
          `🔐 Pair Code Ready

📱 Number: ${formattedPhone}
${country}

┌─────────────┐
│ 🔑 <code>${formattedCode}</code> │
└─────────────┘

📌 How to link:
WhatsApp → Settings → Linked Devices
→ Link a Device → Enter code above

⏰ Code expires in ~60 seconds

[ ♡ SIMON TECH BOT2 👀 ]

╰┈➤ Number: ${formattedPhone}

╰┈➤ Country: ${country}

╰┈➤ Code: ${formattedCode}`,
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
        `❌ Error generating pairing code

Please check:
• Phone number format
• WhatsApp is installed
• Your internet connection`,
        { chat_id: chatId, message_id: generatingMsg.message_id, parse_mode: 'HTML' }
      );
    }

    sock.ev.on('creds.update', saveCreds);
  } catch (error) {
    console.error('Error generating session:', error);
    await bot.editMessageText(
      `❌ Error: ${error.message}`,
      { chat_id: chatId, message_id: generatingMsg.message_id, parse_mode: 'HTML' }
    );
  }
});

// /sessions command
bot.onText(/^\/sessions$/i, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (userSessions[userId]) {
    const session = userSessions[userId];
    const sessionsMessage = `╔════════════════════════╗
║ 💖 ACTIVE SESSIONS 💖  ║
╚════════════════════════╝

📱 Phone: ${session.phoneNumber}
🔐 Session ID: ${session.sessionId}
${session.pairingCode ? `🔑 Code: ${session.pairingCode}` : ''}
${session.connected ? '✅ Status: Connected' : '⏳ Status: Pending'}`;

    bot.sendMessage(chatId, sessionsMessage, { parse_mode: 'HTML' });
  } else {
    bot.sendMessage(
      chatId,
      '❌ No active sessions\n\n📌 Use /pair <phone_number> to generate a new session',
      { parse_mode: 'HTML' }
    );
  }
});

// /cancel command
bot.onText(/^\/cancel$/i, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (userStates[userId]) {
    if (userStates[userId].socket) {
      userStates[userId].socket.end();
    }
    delete userStates[userId];
    bot.sendMessage(chatId, '✅ Operation cancelled', { parse_mode: 'HTML' });
  } else {
    bot.sendMessage(chatId, '❌ No active operation to cancel', { parse_mode: 'HTML' });
  }
});

// Handle unknown commands (MUST BE LAST)
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text || '';

  // Only handle if it's a command
  if (text.startsWith('/')) {
    const command = text.split(' ')[0].toLowerCase();
    const validCommands = ['/start', '/help', '/ping', '/pair', '/sessions', '/cancel'];
    
    // If not a valid command, show error
    if (!validCommands.some(cmd => command === cmd)) {
      bot.sendMessage(
        chatId,
        `❌ Unknown command: ${command}\n\n📌 Use /help to see available commands`,
        { parse_mode: 'HTML' }
      );
    }
  }
});

console.log('╔════════════════════════╗');
console.log('║ 💖 SIMON TECH BOT 2 💖 ║');
console.log('╚════════════════════════╝');
console.log('🚀 Bot is running...');
console.log('📌 Bot Token:', TOKEN && TOKEN !== 'YOUR_TELEGRAM_BOT_TOKEN_HERE' ? '✅ Configured' : '❌ Missing');
console.log('⏱️ Polling enabled for commands\n');

// Handle bot errors
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

module.exports = bot;
