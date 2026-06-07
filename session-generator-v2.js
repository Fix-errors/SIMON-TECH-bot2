const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.json());

let qrCodeData = null;
let sessionGenerated = false;
let sessionId = null;
let pairingCode = null;
let phoneNumberData = null;
let countryCode = null;
let sockets = {};

// Ensure sessions directory exists
const sessionsDir = path.join(__dirname, 'sessions');
if (!fs.existsSync(sessionsDir)) {
  fs.mkdirSync(sessionsDir, { recursive: true });
}

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
    if (phone.startsWith('+' + code)) {
      return country;
    }
  }
  return '🌍 Unknown';
}

function formatPhoneDisplay(phone) {
  // Extract last 8 digits
  const lastDigits = phone.replace(/\D/g, '').slice(-8);
  return '****' + lastDigits;
}

function printSessionInfo(phone, code) {
  const country = getCountry(phone);
  const displayPhone = formatPhoneDisplay(phone);
  
  console.log('\n');
  console.log('╭━━━━━━━━━━━━━━━╮');
  console.log('♡ 𝐒𝐈𝐌𝐎𝐍 𝐓𝐄𝐂𝐇 𝐁𝐎𝐓 𝟐 👀');
  console.log('╰━━━━━━━━━━━━━━━╯');
  console.log('');
  console.log(`╰┈➤ ɴᴜᴍʙᴇʀ : ${phone}`);
  console.log(`╰┈➤ ᴄᴏᴜɴᴛʀʏ : ${country}`);
  console.log('╰┈➤ ʙʀᴀɴᴅ : SIMO-TECH');
  console.log(`╰┈➤ ᴘᴀɪʀ ᴄᴏᴅᴇ : ${code}`);
  console.log('');
  console.log('[ ❤️‍🩹 𝐒𝐄𝐒𝐒𝐈𝐎𝐍 𝐂𝐎𝐍𝐍𝐄𝐂𝐓𝐈𝐍𝐆 ❤️‍🩹 ]');
  console.log('\n');
}

function printSessionSuccess(phone, code) {
  const country = getCountry(phone);
  
  console.log('\n');
  console.log('╭━━━━━━━━━━━━━━━╮');
  console.log('💖 𝐒𝐈𝐌𝐎𝐍 𝐓𝐄𝐂𝐇 𝐁𝐎𝐓 𝟐 💖');
  console.log('╰━━━━━━━━━━━━━━━╯');
  console.log('');
  console.log('✅ 𝐏𝐚𝐢𝐫 𝐂𝐨𝐝𝐞 𝐆𝐞𝐧𝐞𝐫𝐚𝐭𝐞𝐝');
  console.log('');
  console.log(`📱 𝐍𝐮𝐦𝐛𝐞𝐫: ${phone}`);
  console.log(`${country}`);
  console.log('');
  console.log(`🔑 𝐂𝐨𝐝𝐞: ${code}`);
  console.log('');
  console.log('📲 𝐄𝐧𝐭𝐞𝐫 𝐭𝐡𝐢𝐬 𝐜𝐨𝐝𝐞 𝐢𝐧 𝐖𝐡𝐚𝐭𝐬𝐀𝐩𝐩');
  console.log('❤️‍🩹 𝐒𝐞𝐬𝐬𝐢𝐨𝐧 𝐂𝐨𝐧𝐧𝐞𝐜𝐭𝐢𝐧𝐠...');
  console.log('\n');
}

// Session Generator with QR Code method
async function generateSessionQR() {
  try {
    const sessionPath = path.join(sessionsDir, 'SIMON');
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
    });

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        qrCodeData = qr;
        sessionGenerated = false;
        console.log('✅ QR Code generated. Scan it with your WhatsApp app.');
      }

      if (connection === 'open') {
        sessionGenerated = true;
        sessionId = 'SIMON';
        console.log('✅ Session generated successfully via QR!');
        console.log(`📱 Session ID: ${sessionId}`);

        // Generate SESSION_ID string
        try {
          await new Promise(resolve => setTimeout(resolve, 1000));
          const credentialsPath = path.join(sessionPath, 'creds.json');
          if (fs.existsSync(credentialsPath)) {
            const credentials = fs.readFileSync(credentialsPath, 'utf-8');
            const encodedSession = Buffer.from(credentials).toString('base64');
            sessionId = encodedSession;
            console.log(`\n🔐 Your SESSION_ID (Base64):\n${sessionId}\n`);
          }
        } catch (err) {
          console.error('Error reading credentials:', err);
        }
      }

      if (connection === 'close') {
        const shouldReconnect =
          lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
        if (shouldReconnect) {
          setTimeout(generateSessionQR, 3000);
        } else {
          sock.end();
        }
      }
    });

    sock.ev.on('creds.update', saveCreds);

  } catch (error) {
    console.error('Error generating session:', error);
  }
}

// Session Generator with Phone Number Pairing
async function generateSessionPhone(phoneNumber) {
  try {
    phoneNumberData = phoneNumber;
    const sessionPath = path.join(sessionsDir, 'SIMON_PHONE');
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
    });

    sockets['phone'] = sock;

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect } = update;

      if (connection === 'open') {
        sessionGenerated = true;
        sessionId = 'SIMON_PHONE';
        console.log('✅ Session generated successfully via Phone!');
        console.log(`📱 Session ID: ${sessionId}`);

        try {
          await new Promise(resolve => setTimeout(resolve, 1000));
          const credentialsPath = path.join(sessionPath, 'creds.json');
          if (fs.existsSync(credentialsPath)) {
            const credentials = fs.readFileSync(credentialsPath, 'utf-8');
            const encodedSession = Buffer.from(credentials).toString('base64');
            sessionId = encodedSession;
            console.log(`\n🔐 Your SESSION_ID (Base64):\n${sessionId}\n`);
          }
        } catch (err) {
          console.error('Error reading credentials:', err);
        }
      }

      if (connection === 'close') {
        const shouldReconnect =
          lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
        if (shouldReconnect) {
          setTimeout(() => generateSessionPhone(phoneNumber), 3000);
        } else {
          sock.end();
        }
      }
    });

    // Wait for socket to be ready
    await new Promise(resolve => {
      const checkReady = setInterval(() => {
        if (sock.authState && sock.authState.creds) {
          clearInterval(checkReady);
          resolve();
        }
      }, 100);
      setTimeout(() => clearInterval(checkReady), 10000);
    });

    // Request pairing code
    try {
      if (!sock.authState.creds.registered) {
        const code = await sock.requestPairingCode(phoneNumber);
        pairingCode = code;
        printSessionInfo(phoneNumber, code);
        console.log(`\n📱 Pairing Code: ${code}\n`);
      }
    } catch (codeError) {
      console.error('Error requesting pairing code:', codeError);
    }

    sock.ev.on('creds.update', saveCreds);

  } catch (error) {
    console.error('Error generating session via phone:', error);
  }
}

// Web UI
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>SIMON-TECH-BOT - Session Generator</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Courier New', monospace;
          background: #0a0e27;
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
          color: #fff;
        }
        .container {
          background: linear-gradient(135deg, #1a1f3a 0%, #16213e 100%);
          border-radius: 15px;
          border: 2px solid #667eea;
          box-shadow: 0 20px 60px rgba(102, 126, 234, 0.4);
          max-width: 700px;
          width: 100%;
          padding: 40px;
          text-align: center;
        }
        .header {
          margin-bottom: 30px;
          border: 2px dashed #667eea;
          padding: 20px;
          border-radius: 10px;
        }
        h1 {
          font-size: 24px;
          margin-bottom: 5px;
          color: #ff69b4;
          letter-spacing: 2px;
        }
        .subtitle {
          color: #667eea;
          font-size: 14px;
          margin-bottom: 10px;
        }
        .tabs {
          display: flex;
          gap: 10px;
          margin: 20px 0;
          border-bottom: 2px solid #667eea;
        }
        .tab-btn {
          flex: 1;
          padding: 12px;
          background: transparent;
          border: none;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          color: #999;
          border-bottom: 3px solid transparent;
          transition: all 0.3s;
          font-family: 'Courier New', monospace;
        }
        .tab-btn.active {
          color: #ff69b4;
          border-bottom-color: #ff69b4;
        }
        .tab-content {
          display: none;
        }
        .tab-content.active {
          display: block;
        }
        .qr-container {
          margin: 30px 0;
          padding: 20px;
          background: #0a0e27;
          border-radius: 10px;
          display: none;
          border: 2px solid #667eea;
        }
        .qr-container.active {
          display: block;
        }
        #qrCode {
          max-width: 300px;
          width: 100%;
          margin: 0 auto;
          background: white;
          padding: 10px;
          border-radius: 8px;
        }
        .button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: 2px solid #667eea;
          padding: 12px 30px;
          border-radius: 5px;
          cursor: pointer;
          font-size: 14px;
          margin: 10px 5px;
          transition: all 0.3s;
          font-weight: bold;
          font-family: 'Courier New', monospace;
        }
        .button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(102, 126, 234, 0.5);
          background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
        }
        .button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }
        .input-group {
          margin: 20px 0;
          text-align: left;
        }
        .input-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #667eea;
          font-size: 12px;
        }
        .input-group input {
          width: 100%;
          padding: 10px;
          border: 2px solid #667eea;
          border-radius: 5px;
          font-size: 14px;
          background: #0a0e27;
          color: #fff;
          font-family: 'Courier New', monospace;
          transition: border-color 0.3s;
        }
        .input-group input:focus {
          outline: none;
          border-color: #ff69b4;
          box-shadow: 0 0 10px rgba(255, 105, 180, 0.3);
        }
        .session-display {
          margin: 20px 0;
          padding: 15px;
          background: #0a0e27;
          border-radius: 8px;
          display: none;
          word-break: break-all;
          max-height: 200px;
          overflow-y: auto;
          text-align: left;
          border: 2px solid #667eea;
          font-size: 11px;
          font-family: 'Courier New', monospace;
          color: #90ee90;
        }
        .session-display.active {
          display: block;
        }
        .copy-btn {
          background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
          border-color: #28a745;
          margin-top: 10px;
        }
        .copy-btn:hover:not(:disabled) {
          box-shadow: 0 10px 20px rgba(40, 167, 69, 0.5);
          background: linear-gradient(135deg, #20c997 0%, #28a745 100%);
        }
        .status {
          padding: 12px;
          border-radius: 5px;
          margin: 15px 0;
          display: none;
          font-weight: bold;
          border: 2px solid;
          font-size: 12px;
          font-family: 'Courier New', monospace;
        }
        .status.active {
          display: block;
        }
        .status.success {
          background: rgba(40, 167, 69, 0.2);
          color: #90ee90;
          border-color: #28a745;
        }
        .status.waiting {
          background: rgba(255, 193, 7, 0.2);
          color: #ffd700;
          border-color: #ffc107;
          animation: pulse 1.5s infinite;
        }
        .status.error {
          background: rgba(220, 53, 69, 0.2);
          color: #ff6b6b;
          border-color: #dc3545;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .info {
          background: rgba(102, 126, 234, 0.2);
          padding: 15px;
          border-radius: 8px;
          margin: 20px 0;
          font-size: 12px;
          color: #9db4ff;
          border-left: 4px solid #667eea;
          text-align: left;
          font-family: 'Courier New', monospace;
        }
        .pairing-code {
          background: rgba(255, 105, 180, 0.2);
          padding: 20px;
          border-radius: 8px;
          margin: 15px 0;
          font-size: 20px;
          font-weight: bold;
          color: #ff69b4;
          font-family: 'Courier New', monospace;
          letter-spacing: 4px;
          border: 2px dashed #ff69b4;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>♡ SIMON-TECH-BOT 2 ♡</h1>
          <p class="subtitle">WhatsApp Session Generator v2</p>
        </div>

        <div class="tabs">
          <button class="tab-btn active" data-tab="qr">📱 QR Code</button>
          <button class="tab-btn" data-tab="phone">☎️ Phone Pairing</button>
        </div>

        <!-- QR Code Tab -->
        <div id="qr" class="tab-content active">
          <div class="info">
            ➤ Click "Generate QR Code"<br>
            ➤ Scan with WhatsApp on your phone<br>
            ➤ Wait for session to generate<br>
            ➤ Copy your SESSION_ID
          </div>

          <button class="button" id="qr-btn" onclick="generateQR()">🔄 Generate QR Code</button>
          
          <div id="qr-status" class="status"></div>
          
          <div class="qr-container" id="qrContainer">
            <p style="color: #667eea; margin-bottom: 15px;">Scan this QR code with your WhatsApp:</p>
            <div id="qrCode"></div>
            <p style="color: #999; font-size: 11px; margin-top: 10px;">⏱️ QR expires in 60 seconds</p>
          </div>

          <div class="session-display" id="qr-sessionDisplay">
            <strong>✅ Session ID Generated!</strong><br><br>
            <code id="qr-sessionId"></code>
          </div>

          <button class="button copy-btn" id="qr-copyBtn" onclick="copySession('qr')" style="display: none;">📋 Copy SESSION_ID</button>
        </div>

        <!-- Phone Number Tab -->
        <div id="phone" class="tab-content">
          <div class="info">
            ➤ Enter your WhatsApp phone number (with country code)<br>
            ➤ Click "Request Pairing Code"<br>
            ➤ A 8-digit code will appear<br>
            ➤ Enter it in WhatsApp linking<br>
            ➤ Copy your SESSION_ID
          </div>

          <div class="input-group">
            <label for="phoneNumber">📞 Phone Number (e.g., +2349166265317):</label>
            <input type="tel" id="phoneNumber" placeholder="+2349166265317" />
          </div>

          <button class="button" id="phone-btn" onclick="generatePhone()">📲 Request Pairing Code</button>
          
          <div id="phone-status" class="status"></div>
          
          <div class="pairing-code" id="pairingCodeDisplay" style="display: none;">
            <span id="pairingCodeValue"></span>
          </div>

          <div class="session-display" id="phone-sessionDisplay">
            <strong>✅ Session ID Generated!</strong><br><br>
            <code id="phone-sessionId"></code>
          </div>

          <button class="button copy-btn" id="phone-copyBtn" onclick="copySession('phone')" style="display: none;">📋 Copy SESSION_ID</button>
        </div>
      </div>

      <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcode.js/1.5.3/qrcode.min.js"></script>
      <script>
        function switchTab(tab) {
          document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
          document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
          document.getElementById(tab).classList.add('active');
          document.querySelector(\`[data-tab="\${tab}"]\`).classList.add('active');
        }

        document.addEventListener('DOMContentLoaded', function() {
          document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', function() {
              switchTab(this.getAttribute('data-tab'));
            });
          });
        });

        async function generateQR() {
          const status = document.getElementById('qr-status');
          const qrContainer = document.getElementById('qrContainer');
          const sessionDisplay = document.getElementById('qr-sessionDisplay');
          const copyBtn = document.getElementById('qr-copyBtn');
          const btn = document.getElementById('qr-btn');

          btn.disabled = true;
          status.textContent = '⏳ Generating QR Code...';
          status.className = 'status active waiting';
          qrContainer.classList.remove('active');
          sessionDisplay.classList.remove('active');
          copyBtn.style.display = 'none';

          try {
            const response = await fetch('/generate-qr');
            const data = await response.json();

            if (data.qr) {
              document.getElementById('qrCode').innerHTML = '';
              new QRCode(document.getElementById('qrCode'), data.qr);
              qrContainer.classList.add('active');
              status.textContent = '📱 Scan the QR code with your WhatsApp phone';
              status.className = 'status active waiting';

              checkSessionQR();
            } else {
              status.textContent = '❌ Failed to generate QR code';
              status.className = 'status active error';
              btn.disabled = false;
            }
          } catch (error) {
            status.textContent = '❌ Error: ' + error.message;
            status.className = 'status active error';
            btn.disabled = false;
          }
        }

        async function generatePhone() {
          const phoneNumber = document.getElementById('phoneNumber').value;
          if (!phoneNumber) {
            alert('❌ Please enter a phone number');
            return;
          }

          const status = document.getElementById('phone-status');
          const pairingDisplay = document.getElementById('pairingCodeDisplay');
          const sessionDisplay = document.getElementById('phone-sessionDisplay');
          const copyBtn = document.getElementById('phone-copyBtn');
          const btn = document.getElementById('phone-btn');

          btn.disabled = true;
          status.textContent = '⏳ Requesting pairing code... (this may take 30 seconds)';
          status.className = 'status active waiting';
          pairingDisplay.style.display = 'none';
          sessionDisplay.classList.remove('active');
          copyBtn.style.display = 'none';

          try {
            const response = await fetch('/generate-phone', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ phoneNumber })
            });
            const data = await response.json();

            if (data.pairingCode && data.pairingCode !== 'Generating...') {
              document.getElementById('pairingCodeValue').textContent = data.pairingCode;
              pairingDisplay.style.display = 'block';
              status.textContent = '✅ Pairing code received! Enter it in WhatsApp.';
              status.className = 'status active success';

              checkSessionPhone();
            } else {
              status.textContent = '⏳ Still generating code... Please wait';
              status.className = 'status active waiting';
              
              let attempts = 0;
              const pollCode = setInterval(async () => {
                attempts++;
                try {
                  const checkResponse = await fetch('/check-session');
                  const checkData = await checkResponse.json();
                  if (checkData.pairingCode && checkData.pairingCode !== 'Generating...') {
                    document.getElementById('pairingCodeValue').textContent = checkData.pairingCode;
                    pairingDisplay.style.display = 'block';
                    status.textContent = '✅ Pairing code received! Enter it in WhatsApp.';
                    status.className = 'status active success';
                    clearInterval(pollCode);
                    btn.disabled = false;
                    checkSessionPhone();
                  }
                  if (attempts > 30) {
                    clearInterval(pollCode);
                    status.textContent = '❌ Timeout waiting for pairing code';
                    status.className = 'status active error';
                    btn.disabled = false;
                  }
                } catch (err) {
                  if (attempts > 30) {
                    clearInterval(pollCode);
                    btn.disabled = false;
                  }
                }
              }, 1000);
            }
          } catch (error) {
            status.textContent = '❌ Error: ' + error.message;
            status.className = 'status active error';
            btn.disabled = false;
          }
        }

        async function checkSessionQR() {
          try {
            const response = await fetch('/check-session');
            const data = await response.json();

            if (data.sessionGenerated && data.sessionId && data.sessionId !== 'SIMON') {
              const status = document.getElementById('qr-status');
              const sessionDisplay = document.getElementById('qr-sessionDisplay');
              const copyBtn = document.getElementById('qr-copyBtn');
              const btn = document.getElementById('qr-btn');

              document.getElementById('qr-sessionId').textContent = data.sessionId;
              sessionDisplay.classList.add('active');
              copyBtn.style.display = 'inline-block';
              
              status.textContent = '✅ Session generated successfully!';
              status.className = 'status active success';
              
              document.getElementById('qrContainer').classList.remove('active');
              btn.disabled = false;
            } else {
              setTimeout(checkSessionQR, 2000);
            }
          } catch (error) {
            setTimeout(checkSessionQR, 2000);
          }
        }

        async function checkSessionPhone() {
          try {
            const response = await fetch('/check-session');
            const data = await response.json();

            if (data.sessionGenerated && data.sessionId && data.sessionId !== 'SIMON_PHONE') {
              const status = document.getElementById('phone-status');
              const sessionDisplay = document.getElementById('phone-sessionDisplay');
              const copyBtn = document.getElementById('phone-copyBtn');
              const btn = document.getElementById('phone-btn');

              document.getElementById('phone-sessionId').textContent = data.sessionId;
              sessionDisplay.classList.add('active');
              copyBtn.style.display = 'inline-block';
              
              status.textContent = '✅ Session generated successfully!';
              status.className = 'status active success';
              
              document.getElementById('pairingCodeDisplay').style.display = 'none';
              btn.disabled = false;
            } else {
              setTimeout(checkSessionPhone, 2000);
            }
          } catch (error) {
            setTimeout(checkSessionPhone, 2000);
          }
        }

        function copySession(method) {
          const sessionText = document.getElementById(method + '-sessionId').textContent;
          navigator.clipboard.writeText(sessionText).then(() => {
            alert('✅ SESSION_ID copied to clipboard!');
          });
        }
      </script>
    </body>
    </html>
  `);
});

app.get('/generate-qr', (req, res) => {
  if (qrCodeData) {
    res.json({ qr: qrCodeData });
  } else {
    generateSessionQR();
    res.json({ message: 'Generating QR code...' });
  }
});

app.post('/generate-phone', (req, res) => {
  const { phoneNumber } = req.body;
  if (phoneNumber) {
    generateSessionPhone(phoneNumber);
    res.json({ pairingCode: pairingCode || 'Generating...', status: 'processing' });
  } else {
    res.status(400).json({ error: 'Phone number required' });
  }
});

app.get('/check-session', (req, res) => {
  res.json({ sessionGenerated, sessionId, pairingCode });
});

app.listen(PORT, () => {
  console.log(`🚀 Session Generator v2 running on http://localhost:${PORT}`);
  console.log(`📱 Open this link in your browser to generate your SESSION_ID`);
  console.log('\n╭━━━━━━━━━━━━━━━╮');
  console.log('♡ SIMON-TECH-BOT 2 👀');
  console.log('╰━━━━━━━━━━━━━━━╯\n');
});
