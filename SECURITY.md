# Security Guide

This API includes multiple security layers to protect against unauthorized access and abuse.

## Security Features

### 1. **API Key Authentication**
All endpoints require a valid API key to access.

**How it works:**
- API key must be provided in query parameter `?api_key=YOUR_KEY` or header `X-API-Key: YOUR_KEY`
- Without key: Returns 401 Unauthorized
- With wrong key: Returns 403 Forbidden
- With correct key: Grants access

**Your API Key:**
```
REDACTED_API_KEY
```

**⚠️ IMPORTANT:** Keep this key secret! Don't commit it to git or share publicly.

### 2. **HTTPS Encryption**
When using ngrok, all traffic is automatically encrypted with HTTPS, preventing man-in-the-middle attacks.

### 3. **Rate Limiting**
- **Limit:** 100 requests per 15 minutes per IP address
- **Purpose:** Prevents abuse and DDoS attacks
- **Response:** Returns "Too many requests" if limit exceeded

### 4. **Input Validation**
- Only allows alphanumeric characters, spaces, hyphens, and underscores
- Maximum input length: 100 characters
- Prevents injection attacks (SQL, XSS, command injection)

### 5. **Security Headers (Helmet)**
Automatically sets secure HTTP headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `X-XSS-Protection: 1; mode=block`
- And more...

## Using with Fossabot

### Fossabot Command Examples

**Important:** Include your API key in the URL!

```
Command: !quests
Response: $(urlfetch https://YOUR-NGROK-URL/quests?api_key=REDACTED_API_KEY)
```

```
Command: !quest
Response: $(urlfetch https://YOUR-NGROK-URL/quest/$(querystring)?api_key=REDACTED_API_KEY)
```

```
Command: !item
Response: $(urlfetch https://YOUR-NGROK-URL/item/$(querystring)?api_key=REDACTED_API_KEY)
```

```
Command: !events
Response: $(urlfetch https://YOUR-NGROK-URL/events?api_key=REDACTED_API_KEY)
```

## Best Practices

### ✅ DO:
- Keep your `.env` file private
- Use HTTPS (ngrok provides this automatically)
- Monitor your server logs for suspicious activity
- Regenerate your API key if you suspect it's compromised

### ❌ DON'T:
- Commit `.env` to git (it's in `.gitignore`)
- Share your API key publicly
- Use HTTP in production
- Disable security features

## Regenerating Your API Key

If your key is compromised:

1. Generate a new key:
   ```bash
   openssl rand -hex 32
   ```

2. Update `.env`:
   ```
   API_KEY=your-new-key-here
   ```

3. Restart the server:
   ```bash
   npm start
   ```

4. Update all Fossabot commands with the new key

## Monitoring

Check server logs for security events:
```bash
tail -f /tmp/arc-server.log
```

Look for:
- Failed authentication attempts (401/403 errors)
- Rate limit violations
- Invalid input attempts

## ngrok Security

When using ngrok:
- ✅ Automatically provides HTTPS
- ✅ Hides your real IP address
- ✅ Provides DDoS protection
- ⚠️ Free tier URLs are temporary (change on restart)
- 💡 Consider ngrok paid plan for static URLs

## Production Deployment

For production (non-ngrok):
- Use a proper hosting service (Heroku, Railway, DigitalOcean)
- Enable firewall rules
- Use environment variables for secrets
- Set up monitoring and alerts
- Consider adding IP whitelisting if needed
- Use a reverse proxy (nginx/Apache) with additional security
