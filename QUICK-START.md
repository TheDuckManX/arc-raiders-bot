# Quick Start Guide

## Your API Key
```
1ba020fc09eff2beb393dc53bc27652049fedb6ba17f29ee25be5d73d0147b95
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
$(urlfetch https://arc-raiders-bot-production-8101.up.railway.app/quests?api_key=1ba020fc09eff2beb393dc53bc27652049fedb6ba17f29ee25be5d73d0147b95)
```

### !quest
```
$(urlfetch https://arc-raiders-bot-production-8101.up.railway.app/quest/$(querystring)?api_key=1ba020fc09eff2beb393dc53bc27652049fedb6ba17f29ee25be5d73d0147b95)
```

### !item
```
$(urlfetch https://arc-raiders-bot-production-8101.up.railway.app/item/$(querystring)?api_key=1ba020fc09eff2beb393dc53bc27652049fedb6ba17f29ee25be5d73d0147b95)
```

### !arc
```
$(urlfetch https://arc-raiders-bot-production-8101.up.railway.app/arc/$(querystring)?api_key=1ba020fc09eff2beb393dc53bc27652049fedb6ba17f29ee25be5d73d0147b95)
```

### !map
```
$(urlfetch https://arc-raiders-bot-production-8101.up.railway.app/map/$(querystring)?api_key=1ba020fc09eff2beb393dc53bc27652049fedb6ba17f29ee25be5d73d0147b95)
```

### !maps
```
$(urlfetch https://arc-raiders-bot-production-8101.up.railway.app/maps?api_key=1ba020fc09eff2beb393dc53bc27652049fedb6ba17f29ee25be5d73d0147b95)
```

### !events
```
$(urlfetch https://arc-raiders-bot-production-8101.up.railway.app/events?api_key=1ba020fc09eff2beb393dc53bc27652049fedb6ba17f29ee25be5d73d0147b95)
```

### !arcblueprint
```
$(urlfetch https://arc-raiders-bot-production-8101.up.railway.app/blueprint/$(querystring)?api_key=1ba020fc09eff2beb393dc53bc27652049fedb6ba17f29ee25be5d73d0147b95)
```

### !trials
```
$(urlfetch https://arc-raiders-bot-production-8101.up.railway.app/trials?api_key=1ba020fc09eff2beb393dc53bc27652049fedb6ba17f29ee25be5d73d0147b95)
```

---

## Testing

Test in your browser:
```
https://arc-raiders-bot-production-8101.up.railway.app/health
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
