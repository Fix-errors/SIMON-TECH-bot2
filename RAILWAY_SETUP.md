# Railway Bot Deployment Guide

## Required Steps to Fix Bot Not Responding

### 1. **Set Environment Variable in Railway**
   - Go to your Railway project
   - Click on the bot service
   - Go to **Variables** tab
   - Add this variable:
     ```
     TELEGRAM_BOT_TOKEN=<your_bot_token>
     ```
   - Replace `<your_bot_token>` with your actual Telegram bot token from BotFather

### 2. **Redeploy the Application**
   - After adding the environment variable, trigger a redeploy:
     - Push a new commit to your repository
     - OR manually trigger a redeploy from the Railway dashboard

### 3. **Verify Bot is Running**
   - Go to your bot on Telegram
   - Send `/ping` command
   - If it responds, your bot is working ✅

## Common Issues & Fixes

### Issue: "Bot is not responding"
**Solution:** Check that `TELEGRAM_BOT_TOKEN` is set in Railway variables

### Issue: "Bot crashes on startup"
**Solution:** Make sure all dependencies are installed (package.json was fixed)

### Issue: "Logs show 'Polling error'"
**Solution:** This is normal if token is invalid. Update the token in Railway variables.

## Files Fixed

1. **package.json** - Added `node-telegram-bot-api` dependency
2. **Main entry point** - Changed from `session-generator-v2.js` to `telegram-bot.js`
3. **.env.example** - Updated with instructions

Your bot should now work once you deploy these changes! 🚀
