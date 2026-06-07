const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.json());

let qrCodeData = null;
let sessionGenerated = false;
let sessionId = null;
let pairingCode = null;
let sockets = {}; // Store socket instances

// Ensure sessions directory exists
const sessionsDir = path.join(__dirname, 'sessions');
if (!fs.existsSync(sessionsDir)) {
  fs.mkdirSync(sessionsDir, { recursive: true });
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
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for creds to save
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
    const sessionPath = path.join(sessionsDir, 'SIMON_PHONE');
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
    });

    sockets['phone'] = sock; // Store the socket

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect } = update;

      if (connection === 'open') {
        sessionGenerated = true;
        sessionId = 'SIMON_PHONE';
        console.log('✅ Session generated successfully via Phone!');
        console.log(`📱 Session ID: ${sessionId}`);

        // Generate SESSION_ID string
        try {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for creds to save
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

    // Wait for socket to be ready before requesting pairing code
    await new Promise(resolve => {
      const checkReady = setInterval(() => {
        if (sock.authState && sock.authState.creds) {
          clearInterval(checkReady);
          resolve();
        }
      }, 100);
      setTimeout(() => clearInterval(checkReady), 10000); // Timeout after 10s
    });

    // Request pairing code
    try {
      if (!sock.authState.creds.registered) {
        const code = await sock.requestPairingCode(phoneNumber);
        pairingCode = code;
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
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
        }
        .container {
          background: white;
          border-radius: 15px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          max-width: 700px;
          width: 100%;
          padding: 40px;
          text-align: center;
        }
        h1 {
          color: #333;
          margin-bottom: 10px;
          font-size: 28px;
        }
        .subtitle {
          color: #666;
          margin-bottom: 30px;
          font-size: 14px;
        }
        .tabs {
          display: flex;
          gap: 10px;
          margin: 20px 0;
          border-bottom: 2px solid #eee;
        }
        .tab-btn {
          flex: 1;
          padding: 12px;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          color: #999;
          border-bottom: 3px solid transparent;
          transition: all 0.3s;
        }
        .tab-btn.active {
          color: #667eea;
          border-bottom-color: #667eea;
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
          background: #f8f9fa;
          border-radius: 10px;
          display: none;
        }
        .qr-container.active {
          display: block;
        }
        #qrCode {
          max-width: 300px;
          width: 100%;
          margin: 0 auto;
        }
        .button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 12px 30px;
          border-radius: 5px;
          cursor: pointer;
          font-size: 16px;
          margin: 10px 5px;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .button:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
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
          color: #333;
        }
        .input-group input {
          width: 100%;
          padding: 10px;
          border: 2px solid #ddd;
          border-radius: 5px;
          font-size: 14px;
          transition: border-color 0.3s;
        }
        .input-group input:focus {
          outline: none;
          border-color: #667eea;
        }
        .session-display {
          margin: 20px 0;
          padding: 15px;
          background: #f0f4ff;
          border-radius: 8px;
          display: none;
          word-break: break-all;
          max-height: 200px;
          overflow-y: auto;
          text-align: left;
          border: 2px solid #667eea;
          font-size: 12px;
          font-family: monospace;
        }
        .session-display.active {
          display: block;
        }
        .copy-btn {
          background: #28a745;
          margin-top: 10px;
        }
        .copy-btn:hover {
          box-shadow: 0 10px 20px rgba(40, 167, 69, 0.3);
        }
        .status {
          padding: 10px;
          border-radius: 5px;
          margin: 15px 0;
          display: none;
          font-weight: bold;
        }
        .status.active {
          display: block;
        }
        .status.success {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }
        .status.waiting {
          background: #fff3cd;
          color: #856404;
          border: 1px solid #ffeaa7;
        }
        .status.error {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }
        .info {
          background: #e7f3ff;
          padding: 15px;
          border-radius: 8px;
          margin: 20px 0;
          font-size: 14px;
          color: #004085;
          border-left: 4px solid #004085;
          text-align: left;
        }
        .pairing-code {
          background: #fff3cd;
          padding: 15px;
          border-radius: 8px;
          margin: 15px 0;
          font-size: 18px;
          font-weight: bold;
          color: #856404;
          font-family: monospace;
          letter-spacing: 2px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🤖 SIMON-TECH-BOT</h1>
        <p class="subtitle">WhatsApp Session Generator v2</p>
        
        <div class="info">
          <strong>ℹ️ Choose pairing method:</strong><br>
          Select either QR Code or Phone Number to generate your session.
        </div>

        <div class="tabs">
          <button class="tab-btn active" data-tab="qr">📱 QR Code</button>
          <button class="tab-btn" data-tab="phone">☎️ Phone Number</button>
        </div>

        <!-- QR Code Tab -->
        <div id="qr" class="tab-content active">
          <div class="info">
            <strong>📖 Instructions:</strong><br>
            1. Click "Generate QR Code"<br>
            2. Scan with WhatsApp on your phone<br>
            3. Wait for session to generate<br>
            4. Copy your SESSION_ID
          </div>

          <button class="button" id="qr-btn" onclick="generateQR()">🔄 Generate QR Code</button>
          
          <div id="qr-status" class="status"></div>
          
          <div class="qr-container" id="qrContainer">
            <p style="color: #666; margin-bottom: 15px;">Scan this QR code with your WhatsApp:</p>
            <div id="qrCode"></div>
            <p style="color: #999; font-size: 12px; margin-top: 10px;">QR expires in 60 seconds</p>
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
            <strong>📖 Instructions:</strong><br>
            1. Enter your WhatsApp phone number (with country code)<br>
            2. Click "Request Pairing Code"<br>
            3. A 8-digit code will appear<br>
            4. Enter it in WhatsApp linking<br>
            5. Copy your SESSION_ID
          </div>

          <div class="input-group">
            <label for="phoneNumber">📞 Phone Number (e.g., +2349166265317):</label>
            <input type="tel" id="phoneNumber" placeholder="+2349166265317" />
          </div>

          <button class="button" id="phone-btn" onclick="generatePhone()">📲 Request Pairing Code</button>
          
          <div id="phone-status" class="status"></div>
          
          <div class="pairing-code" id="pairingCodeDisplay" style="display: none;">
            Code: <span id="pairingCodeValue"></span>
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

        // Add event listeners for tab buttons
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
              // Keep polling
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
});
