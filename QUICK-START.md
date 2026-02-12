# Quick Start Guide

## Your API Key
```
REDACTED_API_KEY
```
⚠️ **Keep this secret!**

## Setup Steps

### 1. Start the Server
```bash
cd arc-raiders-bot
npm start
```

### 2. Setup ngrok
```bash
./setup-ngrok.sh
```

Then follow the instructions to:
1. Sign up at ngrok.com (free)
2. Get your authtoken
3. Run: `ngrok authtoken YOUR_TOKEN`

### 3. Start ngrok Tunnel
In a **new terminal window**:
```bash
ngrok http 3000
```

Copy the HTTPS URL it gives you (like: `https://abc123.ngrok-free.app`)

### 4. Add to Fossabot

Go to your Fossabot dashboard and add these custom commands.

Replace `YOUR-NGROK-URL` with the URL from step 3.

---

## Fossabot Commands (Copy & Paste)

### !quests
```
$(urlfetch YOUR-NGROK-URL/quests?api_key=REDACTED_API_KEY)
```

### !quest
```
$(urlfetch YOUR-NGROK-URL/quest/$(querystring)?api_key=REDACTED_API_KEY)
```

### !item
```
$(urlfetch YOUR-NGROK-URL/item/$(querystring)?api_key=REDACTED_API_KEY)
```

### !arcblueprint
```
$(urlfetch YOUR-NGROK-URL/blueprint/$(querystring)?api_key=REDACTED_API_KEY)
```

### !events
```
$(urlfetch YOUR-NGROK-URL/events?api_key=REDACTED_API_KEY)
```

---

## Testing

Before adding to Fossabot, test in your browser:

```
https://YOUR-NGROK-URL/quests?api_key=REDACTED_API_KEY
```

Should return a list of quests!

---

## Troubleshooting

**"API key required"**
- Make sure you included `?api_key=...` in the URL

**"Connection refused"**
- Is the server running? (`npm start`)
- Is ngrok running? (`ngrok http 3000`)

**"This site can't be reached"**
- Check the ngrok URL is correct
- ngrok URLs change each time you restart ngrok

**Server not starting**
- Kill existing processes: `pkill -f "node server.js"`
- Try again: `npm start`

---

## Running Both Server and ngrok

**Terminal 1:**
```bash
cd arc-raiders-bot
npm start
```
(Leave this running)

**Terminal 2:**
```bash
ngrok http 3000
```
(Leave this running, copy the HTTPS URL)

Both need to stay running for the bot to work!

---

## Security Notes

✅ HTTPS is automatic with ngrok
✅ API key authentication is enabled
✅ Rate limiting protects against abuse
✅ Input validation prevents attacks

See [SECURITY.md](SECURITY.md) for more details.
