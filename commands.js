// All available commands for SIMON-TECH-BOT
const commands = {
  // ⚙️ SYSTEM COMMANDS
  system: {
    ping: { desc: 'Check bot response time', aliases: ['.p', '.pong'] },
    alive: { desc: 'Show bot alive status', aliases: ['.bot', '.check'] },
    menu: { desc: 'Display full command menu' },
    help: { desc: 'Show help information' },
    runtime: { desc: 'Show bot runtime stats' },
    uptime: { desc: 'Display bot uptime', aliases: ['.run'] },
    speed: { desc: 'Check bot speed' },
    status: { desc: 'Bot status information' },
    owner: { desc: 'Show bot owner info' },
    script: { desc: 'Show bot script source' },
    version: { desc: 'Display bot version' },
    info: { desc: 'Bot information' },
    about: { desc: 'About this bot' },
    support: { desc: 'Get support info' },
    donate: { desc: 'Donation information' },
    report: { desc: 'Report a bug' },
    bug: { desc: 'Bug report system' },
    feedback: { desc: 'Send feedback' },
    update: { desc: 'Check for updates' },
    changelog: { desc: 'View changelog' }
  },

  // 👥 GROUP COMMANDS
  group: {
    link: { desc: 'Get group link' },
    revoke: { desc: 'Revoke group link' },
    kick: { desc: 'Kick member from group' },
    kick2: { desc: 'Force kick member' },
    add: { desc: 'Add member to group' },
    promote: { desc: 'Promote member to admin' },
    demote: { desc: 'Remove admin rights' },
    tagall: { desc: 'Tag all members' },
    hidetag: { desc: 'Hide tag everyone' },
    admins: { desc: 'Show group admins' },
    'group open': { desc: 'Open group for all' },
    'group close': { desc: 'Close group' },
    setname: { desc: 'Set group name' },
    setdesc: { desc: 'Set group description' },
    mute: { desc: 'Mute group' },
    unmute: { desc: 'Unmute group' },
    warn: { desc: 'Warn member' },
    unwarn: { desc: 'Remove warning' },
    warnings: { desc: 'Show member warnings' },
    resetwarn: { desc: 'Reset all warnings' },
    ban: { desc: 'Ban member' },
    unban: { desc: 'Unban member' },
    banuser: { desc: 'Ban user from group' },
    softban: { desc: 'Soft ban member' },
    gcstatus: { desc: 'Group status info' }
  },

  // 🛡️ SECURITY COMMANDS
  security: {
    antilink: { desc: 'Block group links' },
    antispam: { desc: 'Block spam messages' },
    antitag: { desc: 'Block mass tags' },
    antibot: { desc: 'Block other bots' },
    antiword: { desc: 'Block specific words' },
    antifake: { desc: 'Block fake accounts' },
    antiflood: { desc: 'Prevent message flooding' },
    antiraid: { desc: 'Raid protection' },
    antinsfw: { desc: 'Block NSFW content' },
    antidelete: { desc: 'Log deleted messages' },
    captcha: { desc: 'CAPTCHA verification' },
    verify: { desc: 'Verify member' },
    unverify: { desc: 'Remove verification' },
    lock: { desc: 'Lock group settings' },
    unlock: { desc: 'Unlock group settings' },
    antimention: { desc: 'Block mentions' },
    anticall: { desc: 'Block calls' },
    antiban: { desc: 'Prevent bans' }
  },

  // 📥 DOWNLOAD COMMANDS
  download: {
    play: { desc: 'Play music from query' },
    ytmp3: { desc: 'Download YouTube as MP3' },
    ytmp4: { desc: 'Download YouTube as MP4' },
    video: { desc: 'Download video' },
    audio: { desc: 'Download audio' },
    tiktok: { desc: 'Download TikTok video' },
    instagram: { desc: 'Download Instagram content' },
    facebook: { desc: 'Download Facebook video' },
    twitter: { desc: 'Download Twitter video' },
    spotify: { desc: 'Download Spotify track' },
    soundcloud: { desc: 'Download SoundCloud' },
    mediafire: { desc: 'Download from MediaFire' },
    apk: { desc: 'Download APK' },
    gdrive: { desc: 'Download from Google Drive' },
    pinterest: { desc: 'Download Pinterest image' }
  },

  // 🎨 MEDIA & STICKERS
  media: {
    sticker: { desc: 'Convert to sticker' },
    s: { desc: 'Quick sticker command' },
    take: { desc: 'Take/copy sticker' },
    wm: { desc: 'Add watermark' },
    toimg: { desc: 'Convert to image' },
    tomp3: { desc: 'Convert to MP3' },
    tovn: { desc: 'Convert to voice note' },
    togif: { desc: 'Convert to GIF' },
    tourl: { desc: 'Convert to URL' },
    tts: { desc: 'Text to speech' },
    attp: { desc: 'Create ATTP effect' },
    qc: { desc: 'Quote command' },
    emojimix: { desc: 'Mix emojis' },
    trigger: { desc: 'Create trigger effect' },
    smeme: { desc: 'Supreme meme' }
  },

  // 🤖 AI SYSTEM
  ai: {
    ai: { desc: 'Chat with AI' },
    gpt: { desc: 'GPT powered chat' },
    chat: { desc: 'AI chat system' },
    ask: { desc: 'Ask AI a question' },
    imagine: { desc: 'Generate image with AI' },
    image: { desc: 'Create image' },
    code: { desc: 'Generate code' },
    fixcode: { desc: 'Fix code errors' },
    explain: { desc: 'Explain code' },
    translateai: { desc: 'Translate using AI' },
    essay: { desc: 'Generate essay' },
    story: { desc: 'Generate story' },
    poem: { desc: 'Generate poem' },
    summary: { desc: 'Summarize text' },
    rewrite: { desc: 'Rewrite text' }
  },

  // 🔍 SEARCH
  search: {
    google: { desc: 'Google search' },
    wiki: { desc: 'Wikipedia search' },
    youtube: { desc: 'YouTube search' },
    lyrics: { desc: 'Search song lyrics' },
    news: { desc: 'Search news' },
    weather: { desc: 'Check weather' },
    github: { desc: 'Search GitHub' },
    npm: { desc: 'Search NPM packages' },
    appstore: { desc: 'Search App Store' },
    define: { desc: 'Define word' },
    translate: { desc: 'Translate text' },
    currency: { desc: 'Check currency rates' }
  },

  // 😂 FUN
  fun: {
    joke: { desc: 'Get a joke' },
    meme: { desc: 'Get random meme' },
    truth: { desc: 'Truth question' },
    dare: { desc: 'Dare challenge' },
    roast: { desc: 'Get roasted' },
    compliment: { desc: 'Get compliment' },
    pickup: { desc: 'Pickup line' },
    ship: { desc: 'Ship two names' },
    love: { desc: 'Love percentage' },
    '8ball': { desc: 'Magic 8-ball' },
    fact: { desc: 'Random fact' },
    quote: { desc: 'Random quote' },
    darkjoke: { desc: 'Dark joke' },
    rate: { desc: 'Rate something' },
    simp: { desc: 'Simp checker' }
  },

  // 🎮 GAMES
  games: {
    tictactoe: { desc: 'Play tic-tac-toe' },
    hangman: { desc: 'Hangman game' },
    guess: { desc: 'Guess the number' },
    math: { desc: 'Math quiz' },
    quiz: { desc: 'Quiz game' },
    riddle: { desc: 'Riddle challenge' },
    slot: { desc: 'Slot machine' },
    dice: { desc: 'Roll dice' },
    chess: { desc: 'Chess game' },
    wordgame: { desc: 'Word game' },
    scramble: { desc: 'Unscramble words' },
    number: { desc: 'Number game' }
  },

  // 💰 ECONOMY
  economy: {
    balance: { desc: 'Check balance' },
    daily: { desc: 'Daily reward' },
    weekly: { desc: 'Weekly reward' },
    work: { desc: 'Work for money' },
    rob: { desc: 'Rob someone' },
    deposit: { desc: 'Deposit money' },
    withdraw: { desc: 'Withdraw money' },
    shop: { desc: 'View shop' },
    buy: { desc: 'Buy item' },
    sell: { desc: 'Sell item' },
    inventory: { desc: 'Check inventory' },
    leaderboard: { desc: 'Money leaderboard' },
    transfer: { desc: 'Transfer money' },
    bet: { desc: 'Place bet' },
    casino: { desc: 'Casino games' }
  },

  // 🧩 UTILITIES
  utilities: {
    calc: { desc: 'Calculator' },
    qr: { desc: 'Generate QR code' },
    readqr: { desc: 'Read QR code' },
    shortlink: { desc: 'Shorten URL' },
    timer: { desc: 'Set timer' },
    reminder: { desc: 'Set reminder' },
    afk: { desc: 'Set AFK status' },
    timezone: { desc: 'Check timezone' },
    countdown: { desc: 'Create countdown' },
    password: { desc: 'Generate password' },
    hash: { desc: 'Hash text' }
  },

  // 📱 SOCIAL
  social: {
    profile: { desc: 'View profile' },
    dp: { desc: 'Get display picture' },
    bio: { desc: 'View bio' },
    stalk: { desc: 'Stalk user' },
    whois: { desc: 'Who is this user' },
    contact: { desc: 'Contact information' }
  },

  // ❤️ RELATIONSHIP
  relationship: {
    love: { desc: 'Love percentage' },
    crush: { desc: 'Crush compatibility' },
    marry: { desc: 'Marry someone' },
    divorce: { desc: 'Divorce' },
    date: { desc: 'Start date' },
    compatibility: { desc: 'Compatibility check' }
  },

  // 🔞 NSFW
  nsfw: {
    'nsfw on': { desc: 'Enable NSFW' },
    'nsfw off': { desc: 'Disable NSFW' },
    waifu: { desc: 'Random waifu' },
    neko: { desc: 'Random neko' },
    hentai: { desc: 'Random hentai' },
    trap: { desc: 'Random trap' }
  },

  // 🔐 OWNER
  owner: {
    block: { desc: 'Block user' },
    unblock: { desc: 'Unblock user' },
    broadcast: { desc: 'Broadcast message' },
    join: { desc: 'Join group' },
    leave: { desc: 'Leave group' },
    setppbot: { desc: 'Set bot profile picture' },
    setnamebot: { desc: 'Set bot name' },
    setstatus: { desc: 'Set bot status' },
    restart: { desc: 'Restart bot' },
    shutdown: { desc: 'Shutdown bot' }
  }
};

module.exports = commands;
