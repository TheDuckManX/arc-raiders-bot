# Quick Start Guide

## Your API Key
```
REDACTED_API_KEY
```
⚠️ **Keep this secret!**

## Railway URL
```
https://arc-raiders-bot-production-8101.up.railway.app
```

---

## Fossabot Commands (Copy & Paste)

### !quests
```
$(urlfetch https://YOUR_RAILWAY_URL/quests?api_key=REDACTED_API_KEY)
```

### !quest
```
$(urlfetch https://YOUR_RAILWAY_URL/quest/$(querystring)?api_key=REDACTED_API_KEY)
```

### !item
```
$(urlfetch https://YOUR_RAILWAY_URL/item/$(querystring)?api_key=REDACTED_API_KEY)
```

### !arc
```
$(urlfetch https://YOUR_RAILWAY_URL/arc/$(querystring)?api_key=REDACTED_API_KEY)
```

### !map
```
$(urlfetch https://YOUR_RAILWAY_URL/map/$(querystring)?api_key=REDACTED_API_KEY)
```

### !maps
```
$(urlfetch https://YOUR_RAILWAY_URL/maps?api_key=REDACTED_API_KEY)
```

### !events
```
$(urlfetch https://YOUR_RAILWAY_URL/events?api_key=REDACTED_API_KEY)
```

### !arcblueprint
```
$(urlfetch https://YOUR_RAILWAY_URL/blueprint/$(querystring)?api_key=REDACTED_API_KEY)
```

---

## Testing

Test in your browser:
```
https://YOUR_RAILWAY_URL/health
```

Should return `{"status":"ok"}`

---

## Troubleshooting

**"API key required"**
- Make sure you included `?api_key=...` in the URL

**"Invalid API key"**
- Check the `API_KEY` environment variable is set in Railway → Variables

**MetaForge API errors**
- The MetaForge API may be temporarily down. Map commands still work locally.

---

## Security Notes

✅ HTTPS via Railway
✅ API key authentication is enabled
✅ Rate limiting protects against abuse
✅ Input validation prevents attacks

See [SECURITY.md](SECURITY.md) for more details.
