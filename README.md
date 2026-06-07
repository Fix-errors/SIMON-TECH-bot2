# SIMON-TECH BOT 2 - Telegram Edition

**WhatsApp Pairing Code Generator via Telegram Bot**

## 🚀 Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Bot Token
Set your Telegram bot token as an environment variable:

**Windows:**
```bash
set TELEGRAM_BOT_TOKEN=your_token_here
node telegram-bot.js
```

**Linux/Mac:**
```bash
export TELEGRAM_BOT_TOKEN=your_token_here
node telegram-bot.js
```

**Or create a `.env` file:**
```
TELEGRAM_BOT_TOKEN=your_token_here
```

### 3. Get Your Bot Token
1. Open Telegram
2. Search for `@BotFather`
3. Send `/newbot` and follow instructions
4. Copy your bot token

## 📱 Bot Commands

### `/start`
- Welcome message with your Telegram ID and name
- Example output:
```
💖 𝐒𝐈𝐌𝐎𝐍 𝐓𝐄𝐂𝐇 𝐁𝐎𝐓 𝟐 💖

👋 Welcome, User!
📱 Telegram ID: 123456789
👤 Name: John Doe
```

### `/pair <phone_number>`
- Generate WhatsApp pairing code for your phone number
- Format: Country code + phone number (no + symbol needed)
- Examples:
  - `/pair 2349166265317` (Nigeria)
  - `/pair 12025551234` (USA)
  - `/pair 447911123456` (UK)

**Response:**
```
╭━━━━━━━━━━━━━━━╮
💖 𝐒𝐈𝐌𝐎𝐍 𝐓𝐄𝐂𝐇 𝐁𝐎𝐓 𝟐 💖
╰━━━━━━━━━━━━━━━╯

✅ 𝐏𝐚𝐢𝐫 𝐂𝐨𝐝𝐞 𝐆𝐞𝐧𝐞𝐫𝐚𝐭𝐞𝐝

📱 𝐍𝐮𝐦𝐛𝐞𝐫: +2349166265317
🇳🇬 𝐍𝐢𝐠𝐞𝐫𝐢𝐚 (+234)

🔑 𝐂𝐨𝐝𝐞: XXXX-XXXX

📲 𝐄𝐧𝐭𝐞𝐫 𝐭𝐡𝐢𝐬 𝐜𝐨𝐝𝐞 𝐢𝐧 𝐖𝐡𝐚𝐭𝐬𝐀𝐩𝐩
❤️‍🩹 𝐒𝐞𝐬𝐬𝐢𝐨𝐧 𝐂𝐨𝐧𝐧𝐞𝐜𝐭𝐢𝐧𝐠...
```

### `/help`
- Display all available commands and their usage
- Shows phone number format examples

### `/ping`
- Check if the bot is online and responsive
- Returns response time in milliseconds

**Response:**
```
✅ 𝐁𝐨𝐭 𝐢𝐬 𝐀𝐂𝐓𝐈𝐕𝐄 ✅

🔌 𝐒𝐭𝐚𝐭𝐮𝐬: 𝐎𝐧𝐥𝐢𝐧𝐞
⚡ 𝐑𝐞𝐬𝐩𝐨𝐧𝐬𝐞 𝐓𝐢𝐦𝐞: 45ms
💖 𝐁𝐨𝐭 𝐇𝐞𝐚𝐥𝐭𝐡𝐲
```

### `/sessions`
- View your active WhatsApp sessions
- Shows phone number, session ID, pairing code, and connection status

### `/cancel`
- Cancel the current operation
- Useful if pairing is taking too long

## 📂 Directory Structure

```
SIMON-TECH-bot2/
├── telegram-bot.js          # Main Telegram bot file
├── session-generator-v2.js  # Original web UI version
├── package.json             # Dependencies
├── README.md                # This file
└── sessions/                # WhatsApp session storage (auto-created)
    ├── SIMON/               # QR-based sessions
    ├── SIMON_PHONE/         # Phone-based sessions
    └── SIMON_<uid>_<ts>/    # User-specific sessions
```

## 🔐 Features

✅ **Secure Session Generation**
- Encrypts credentials in Base64 format
- Sessions stored locally in `sessions/` folder

✅ **Multi-User Support**
- Each user gets their own session
- Multiple sessions per user supported

✅ **Country Detection**
- Automatically detects country from phone code
- Supports 10+ countries

✅ **Real-time Status Updates**
- Live progress messages
- Error handling with detailed messages

## ⚙️ Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `TELEGRAM_BOT_TOKEN` | Your Telegram bot token from @BotFather | Yes |

## 🐛 Troubleshooting

### Bot not responding
1. Check if bot token is correct
2. Verify internet connection
3. Check server logs for errors

### Phone pairing fails
1. Ensure phone number format is correct (no + symbol)
2. Include full country code
3. Check WhatsApp is installed on your phone
4. Ensure strong internet connection

### Session not generating
1. Wait 30-60 seconds for WhatsApp to process
2. Try canceling and requesting again
3. Check if phone is logged out of WhatsApp

## 📝 Example Flow

```
User: /start
Bot: 👋 Welcome, User! 
     📱 Telegram ID: 123456789

User: /pair 2349166265317
Bot: ⏳ Generating Pair Code...
Bot: ✅ Code Generated: XXXX-XXXX
     📲 Enter in WhatsApp...
     ❤️‍🩹 Session Connecting...

User: [Enters code in WhatsApp]

Bot: ✅ Session generated successfully!
     🔐 SESSION_ID: [long-base64-code]
```

## 🚀 Running the Bot

```bash
# Install dependencies first
npm install

# Run with environment variable
export TELEGRAM_BOT_TOKEN=your_token_here
npm start

# Or with npm script
npm run dev
```

## 📞 Support

For issues or questions:
1. Check the README.md file
2. Review console logs for error messages
3. Verify all requirements are met

## ❤️‍🩹 SIMON-TECH BOT 2

Made with ❤️ for secure WhatsApp session generation via Telegram
