const express = require('express');
const NodeCache = require('node-cache');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;

// Trust Railway's reverse proxy so rate limiting works per-viewer IP
app.set('trust proxy', 1);

// Security: Helmet adds various HTTP headers for security
app.use(helmet());

// Rate limiting: Max 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Cache for 5 minutes (300 seconds) to reduce API calls
const cache = new NodeCache({ stdTTL: parseInt(process.env.CACHE_TTL) || 300 });

const BASE_URL = 'https://metaforge.app/api/arc-raiders';

// Upstream API request timeout (ms)
const FETCH_TIMEOUT_MS = 5000;

// Load ARC loot data
let arcLootData = {};
try {
  const lootPath = path.join(__dirname, 'data', 'arc_loot.json');
  console.log(`Attempting to load loot data from: ${lootPath}`);
  arcLootData = JSON.parse(fs.readFileSync(lootPath, 'utf8'));
  console.log(`✅ ARC loot data loaded successfully! (${Object.keys(arcLootData).length} ARCs)`);
} catch (error) {
  console.error(`❌ Error loading arc_loot.json: ${error.message}`);
  console.error(`   Current directory (__dirname): ${__dirname}`);
}

// Middleware: API Key Authentication
function authenticateAPIKey(req, res, next) {
  const apiKey = req.query.api_key || req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({
      error: 'API key required. Provide via ?api_key=YOUR_KEY or X-API-Key header'
    });
  }

  // Constant-time comparison to prevent timing attacks
  try {
    const provided = Buffer.from(apiKey);
    const expected = Buffer.from(API_KEY);
    if (provided.length !== expected.length || !crypto.timingSafeEqual(provided, expected)) {
      return res.status(403).json({ error: 'Invalid API key' });
    }
  } catch {
    return res.status(403).json({ error: 'Invalid API key' });
  }

  next();
}

// Middleware: Input validation and sanitization
function validateInput(req, res, next) {
  const name = req.params.name;
  if (name) {
    // Only allow alphanumeric, spaces, hyphens, and underscores
    if (!/^[a-zA-Z0-9\s\-_]+$/.test(name)) {
      return res.status(400).type('text').send('Invalid input. Only letters, numbers, spaces, hyphens, and underscores allowed.');
    }
    // Limit length to prevent abuse
    if (name.length > 100) {
      return res.status(400).type('text').send('Input too long. Maximum 100 characters.');
    }
  }
  next();
}

// Helper function to fetch from MetaForge API with caching and timeout
async function fetchWithCache(endpoint, cacheKey) {
  const cached = cache.get(cacheKey);
  if (cached) {
    console.log(`Cache hit: ${cacheKey}`);
    return cached;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }
    const json = await response.json();
    // MetaForge API returns {data: [...], cachedAt: ...}
    const data = json.data || json;
    cache.set(cacheKey, data);
    console.log(`Cache miss: ${cacheKey} - fetched from API`);
    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error(`Timeout fetching ${endpoint} after ${FETCH_TIMEOUT_MS}ms`);
      throw new Error('Upstream API timed out. Please try again later.');
    }
    console.error(`Error fetching ${endpoint}:`, error.message);
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Arc Raiders Bot API - Powered by metaforge.app/arc-raiders',
    endpoints: {
      '/quests': 'List all quests',
      '/quest/:name': 'Search for a quest by name',
      '/item/:name': 'Search for an item/weapon by name',
      '/arc/:name': 'Search for an ARC enemy by name',
      '/blueprint/:name': 'Find where a blueprint is located',
      '/events': 'Get upcoming events schedule',
      '/maps': 'List all available maps',
      '/map/:name': 'Get interactive map link',
      '/trials': 'Active weekly trials and time remaining',
      '/health': 'Health check'
    }
  });
});

// Active weekly trials
app.get('/trials', authenticateAPIKey, async (req, res) => {
  try {
    // Fetch full response (not unwrapped) so we get activeWindowEnd for time remaining
    const cacheKey = 'weekly-trials-full';
    let payload = cache.get(cacheKey);

    if (!payload) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      try {
        const response = await fetch(`${BASE_URL}/weekly-trials`, { signal: controller.signal });
        if (!response.ok) throw new Error(`API returned ${response.status}`);
        payload = await response.json();
        cache.set(cacheKey, payload);
      } finally {
        clearTimeout(timer);
      }
    }

    const trials = payload.data || [];
    const active = trials.filter(t => t.is_active);

    if (active.length === 0) {
      return res.type('text').send('No active weekly trials right now. Check back later! | metaforge.app/arc-raiders/weekly-trials');
    }

    // Calculate time remaining from activeWindowEnd (Unix seconds)
    let timeStr = '';
    if (payload.activeWindowEnd) {
      const msLeft = (payload.activeWindowEnd * 1000) - Date.now();
      if (msLeft > 0) {
        const totalMins = Math.floor(msLeft / 60000);
        const days = Math.floor(totalMins / 1440);
        const hours = Math.floor((totalMins % 1440) / 60);
        const mins = totalMins % 60;
        const parts = [];
        if (days > 0) parts.push(`${days}d`);
        if (hours > 0) parts.push(`${hours}h`);
        if (mins > 0) parts.push(`${mins}m`);
        timeStr = parts.length > 0 ? ` (resets in ${parts.join(' ')})` : '';
      } else {
        timeStr = ' (resetting soon)';
      }
    }

    const trialNames = active.map(t => t.name).join(' | ');
    res.type('text').send(`Active Weekly Trials${timeStr}: ${trialNames} | metaforge.app/arc-raiders/weekly-trials`);
  } catch (error) {
    res.status(500).type('text').send('Error fetching weekly trials. Please try again later.');
  }
});

// Health check endpoint (no auth required)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get all events
app.get('/events', authenticateAPIKey, async (req, res) => {
  try {
    const events = await fetchWithCache('/events-schedule', 'events');

    if (!events || events.length === 0) {
      return res.type('text').send('No upcoming events scheduled.');
    }

    // Format for Twitch chat
    const eventList = events.slice(0, 3).map((event, idx) => {
      const name = event.name || 'Unknown Event';
      const time = event.startTime ? new Date(event.startTime).toLocaleString() : 'TBA';
      return `${idx + 1}. ${name} - ${time}`;
    }).join(' | ');

    res.type('text').send(`Upcoming Events: ${eventList} | Data from metaforge.app/arc-raiders`);
  } catch (error) {
    res.status(500).type('text').send('Error fetching events. Please try again later.');
  }
});

// Map data with level support
const MAPS = {
  'dam': {
    name: 'Dam Battlegrounds',
    url: 'https://metaforge.app/arc-raiders/map/dam',
    hasLevels: false
  },
  'spaceport': {
    name: 'The Spaceport',
    url: 'https://metaforge.app/arc-raiders/map/spaceport',
    hasLevels: true,
    levels: {
      'surface': 'Surface',
      'tunnels': 'Tunnels'
    }
  },
  'buried-city': {
    name: 'Buried City',
    url: 'https://metaforge.app/arc-raiders/map/buried-city',
    hasLevels: false
  },
  'blue-gate': {
    name: 'Blue Gate',
    url: 'https://metaforge.app/arc-raiders/map/blue-gate',
    hasLevels: true,
    levels: {
      'surface': 'Surface',
      'underground': 'Underground'
    }
  },
  'blue': {
    name: 'Blue Gate',
    url: 'https://metaforge.app/arc-raiders/map/blue-gate',
    hasLevels: true,
    levels: {
      'surface': 'Surface',
      'underground': 'Underground'
    }
  },
  'stella-montis': {
    name: 'Stella Montis',
    url: 'https://metaforge.app/arc-raiders/map/stella-montis',
    hasLevels: true,
    levels: {
      'top-floor': 'Top Floor',
      'topfloor': 'Top Floor',
      'top': 'Top Floor',
      'bottom-floor': 'Bottom Floor',
      'bottomfloor': 'Bottom Floor',
      'bottom': 'Bottom Floor'
    }
  },
  'stella': {
    name: 'Stella Montis',
    url: 'https://metaforge.app/arc-raiders/map/stella-montis',
    hasLevels: true,
    levels: {
      'top-floor': 'Top Floor',
      'topfloor': 'Top Floor',
      'top': 'Top Floor',
      'bottom-floor': 'Bottom Floor',
      'bottomfloor': 'Bottom Floor',
      'bottom': 'Bottom Floor'
    }
  }
};

// Get all maps
app.get('/maps', authenticateAPIKey, (req, res) => {
  const mapList = Object.values(MAPS).map(m => m.name).join(', ');
  res.type('text').send(`Available Maps: ${mapList} | Use !map <name> for interactive map link | Data from metaforge.app/arc-raiders`);
});

// Handle /map without a name
app.get('/map', authenticateAPIKey, (req, res) => {
  res.type('text').send('Please specify a map name. Usage: !map <name> | Example: !map dam | Use !maps to see all available maps.');
});

// Get specific map
app.get('/map/:name', authenticateAPIKey, validateInput, async (req, res) => {
  try {
    const input = req.params.name.toLowerCase().trim();

    // Parse input to extract map name and level
    // Support formats: "stella-top floor", "stella-topfloor", "spaceport-surface", etc.
    let map = null;
    let mapKey = null;
    let levelSearch = null;
    let levelName = null;

    // Try progressively shorter map names with longer level names
    const parts = input.split('-');
    for (let i = parts.length; i > 0; i--) {
      const potentialMapKey = parts.slice(0, i).join('-');
      const potentialLevel = parts.slice(i).join('-').replace(/\s+/g, '-');

      if (MAPS[potentialMapKey]) {
        mapKey = potentialMapKey;
        map = MAPS[mapKey];
        levelSearch = potentialLevel;
        break;
      }
    }

    // If no match found, try partial matching on map name
    if (!map) {
      mapKey = Object.keys(MAPS).find(key =>
        input.includes(key) || key.includes(input.split('-')[0])
      );
      if (mapKey) {
        map = MAPS[mapKey];
        levelSearch = input.replace(mapKey, '').replace(/^-+/, '').replace(/\s+/g, '-');
      }
    }

    if (!map) {
      return res.type('text').send(`Map "${req.params.name}" not found. Use !maps to see all available maps.`);
    }

    // Look up the level name if a level was specified
    if (levelSearch && map.hasLevels && map.levels) {
      // Try exact match first
      levelName = map.levels[levelSearch];

      // Try without hyphens
      if (!levelName) {
        levelName = map.levels[levelSearch.replace(/-/g, '')];
      }

      // Try partial match
      if (!levelName) {
        const levelKey = Object.keys(map.levels).find(key =>
          key.includes(levelSearch) || levelSearch.includes(key)
        );
        levelName = levelKey ? map.levels[levelKey] : null;
      }
    }

    // Build response
    let response = `${map.name}`;

    if (levelName) {
      response += ` (${levelName})`;
      response += ` - Interactive Map: ${map.url} - Select "${levelName}" in top-right filters`;
    } else if (levelSearch && map.hasLevels) {
      const availableLevels = Object.values(map.levels).filter((v, i, arr) => arr.indexOf(v) === i).join(', ');
      response += ` - Available levels: ${availableLevels}. Example: !map ${mapKey}-${Object.keys(map.levels)[0]}`;
    } else if (!levelSearch && map.hasLevels) {
      const exampleLevels = Object.keys(map.levels).slice(0, 2);
      response += ` - Interactive Map: ${map.url} - Tip: Use "!map ${mapKey}-${exampleLevels[0]}" or "!map ${mapKey}-${exampleLevels[1]}"`;
    } else {
      response += ` - Interactive Map: ${map.url}`;
    }

    response += ' | Data from metaforge.app/arc-raiders';

    res.type('text').send(response);
  } catch (error) {
    res.status(500).type('text').send('Error fetching map data. Please try again later.');
  }
});

// Get all quests
app.get('/quests', authenticateAPIKey, async (req, res) => {
  try {
    const quests = await fetchWithCache('/quests', 'quests');

    if (!quests || quests.length === 0) {
      return res.type('text').send('No quests found.');
    }

    const questCount = quests.length;
    const questNames = quests.slice(0, 5).map(q => q.name || 'Unnamed').join(', ');

    res.type('text').send(`Found ${questCount} quests. Examples: ${questNames}... | Use !quest <name> for details | Data from metaforge.app/arc-raiders`);
  } catch (error) {
    res.status(500).type('text').send('Error fetching quests. Please try again later.');
  }
});

// Handle /quest without a name
app.get('/quest', authenticateAPIKey, (req, res) => {
  res.type('text').send('Please specify a quest name. Usage: !quest <name> | Example: !quest bad | Use !quests to see all quests.');
});

// Search for a specific quest by name
app.get('/quest/:name', authenticateAPIKey, validateInput, async (req, res) => {
  try {
    const searchName = req.params.name.toLowerCase();
    const quests = await fetchWithCache('/quests', 'quests');

    if (!quests || quests.length === 0) {
      return res.type('text').send('No quests found.');
    }

    const quest = quests.find(q =>
      q.name && q.name.toLowerCase().includes(searchName)
    );

    if (!quest) {
      return res.type('text').send(`Quest "${req.params.name}" not found. Try !quests to see available quests.`);
    }

    let details = `Quest: ${quest.name || 'Unknown'}`;

    if (quest.description) {
      details += ` | ${quest.description}`;
    }

    if (quest.objectives && quest.objectives.length > 0) {
      details += ` | Objectives: ${quest.objectives.join(', ')}`;
    }

    if (quest.granted_items && quest.granted_items.length > 0) {
      const rewards = quest.granted_items.map(item =>
        typeof item === 'string' ? item : item.name || 'Item'
      ).join(', ');
      details += ` | Rewards: ${rewards}`;
    }

    if (quest.xp && quest.xp > 0) {
      details += ` | XP: ${quest.xp}`;
    }

    details += ' | Data from metaforge.app/arc-raiders';

    res.type('text').send(details);
  } catch (error) {
    res.status(500).type('text').send('Error fetching quest data. Please try again later.');
  }
});

// Handle /item without a name
app.get('/item', authenticateAPIKey, (req, res) => {
  res.type('text').send('Please specify an item name. Usage: !item <name> | Example: !item rifle');
});

// Get items endpoint - useful for weapon/gear lookups
app.get('/item/:name', authenticateAPIKey, validateInput, async (req, res) => {
  try {
    const searchName = req.params.name.toLowerCase();
    const items = await fetchWithCache('/items', 'items');

    if (!items || items.length === 0) {
      return res.type('text').send('No items found.');
    }

    const item = items.find(i =>
      i.name && i.name.toLowerCase().includes(searchName)
    );

    if (!item) {
      return res.type('text').send(`Item "${req.params.name}" not found.`);
    }

    let details = `${item.name || 'Unknown Item'}`;

    if (item.category) {
      details += ` (${item.category})`;
    }

    if (item.description) {
      details += ` - ${item.description}`;
    }

    details += ' | Data from metaforge.app/arc-raiders';

    res.type('text').send(details);
  } catch (error) {
    res.status(500).type('text').send('Error fetching item data. Please try again later.');
  }
});

// Handle /blueprint without a name
app.get('/blueprint', authenticateAPIKey, (req, res) => {
  res.type('text').send('Please specify a blueprint name. Usage: !arcblueprint <name> | Example: !arcblueprint rifle');
});

// Search for a blueprint by name
app.get('/blueprint/:name', authenticateAPIKey, validateInput, async (req, res) => {
  try {
    const searchName = req.params.name.toLowerCase();
    const blueprints = await fetchWithCache('/blueprints', 'blueprints');

    if (!blueprints || blueprints.length === 0) {
      return res.type('text').send('No blueprint data found.');
    }

    const blueprint = blueprints.find(b =>
      b.name && b.name.toLowerCase().includes(searchName)
    );

    if (!blueprint) {
      return res.type('text').send(`Blueprint "${req.params.name}" not found. Try searching with a partial name.`);
    }

    let details = `Blueprint: ${blueprint.name || 'Unknown'}`;

    if (blueprint.location) {
      details += ` | Found at: ${blueprint.location}`;
    }
    if (blueprint.map) {
      details += ` | Map: ${blueprint.map}`;
    }
    if (blueprint.description) {
      details += ` | ${blueprint.description}`;
    }

    details += ' | Data from metaforge.app/arc-raiders';

    res.type('text').send(details);
  } catch (error) {
    res.status(500).type('text').send('Error fetching blueprint data. Please try again later.');
  }
});

// Handle /arc without a name
app.get('/arc', authenticateAPIKey, (req, res) => {
  res.type('text').send('Please specify an ARC enemy name. Usage: !arc <name> | Example: !arc wasp | !arc queen');
});

// Get ARC enemy data
app.get('/arc/:name', authenticateAPIKey, validateInput, async (req, res) => {
  try {
    const searchName = req.params.name.toLowerCase();
    const arcs = await fetchWithCache('/arcs', 'arcs');

    if (!arcs || arcs.length === 0) {
      return res.type('text').send('No ARC data found.');
    }

    const arc = arcs.find(a =>
      a.name && a.name.toLowerCase().includes(searchName)
    );

    if (!arc) {
      return res.type('text').send(`ARC enemy "${req.params.name}" not found. Try common enemies like: Wasp, Hornet, Leaper, Queen`);
    }

    let details = `${arc.name || 'Unknown ARC'}`;

    // Look up loot by API id (keyed by arc.id in arc_loot.json, e.g. "bison" for Leaper)
    const lootInfo = arcLootData[arc.id];
    if (lootInfo && lootInfo.loot && lootInfo.loot.length > 0) {
      const notableLoot = lootInfo.loot.filter(item =>
        item.rarity === 'Epic' || item.rarity === 'Legendary'
      );

      if (notableLoot.length > 0) {
        const lootList = notableLoot.map(item =>
          `${item.item} (${item.rarity})`
        ).join(', ');
        details += ` | Notable Loot: ${lootList}`;
      } else {
        const lootList = lootInfo.loot.slice(0, 3).map(item => item.item).join(', ');
        details += ` | Loot: ${lootList}`;
      }
    }

    details += ' | Data from metaforge.app/arc-raiders';

    res.type('text').send(details);
  } catch (error) {
    res.status(500).type('text').send('Error fetching ARC data. Please try again later.');
  }
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`Arc Raiders Bot API running on port ${PORT}`);
  console.log(`Endpoints available:`);
  console.log(`  http://localhost:${PORT}/quests`);
  console.log(`  http://localhost:${PORT}/quest/<name>`);
  console.log(`  http://localhost:${PORT}/item/<name>`);
  console.log(`  http://localhost:${PORT}/arc/<name>`);
  console.log(`  http://localhost:${PORT}/events`);
  console.log(`\nData powered by metaforge.app/arc-raiders`);
});

// Graceful shutdown on SIGTERM (e.g. Railway container stop)
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});
