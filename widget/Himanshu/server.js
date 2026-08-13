const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

const HOSPILOT_BASE_URL = 'https://hospilot.carer.ai';

// Route: Create Session
app.post(['/api/session', '/api/widget-session'], async (req, res) => {
  try {
    const { goal } = req.body;
    if (!goal) {
      return res.status(400).json({ error: 'Goal is required' });
    }

    const username = process.env.HOSPILOT_USERNAME;
    const password = process.env.HOSPILOT_PASSWORD;

    if (!username || !password) {
      console.error('Missing HOSPILOT_USERNAME or HOSPILOT_PASSWORD environment variables');
      return res.status(500).json({ error: 'Server configuration error: missing Hospilot API credentials' });
    }

    console.log(`[Backend] Authenticating user: ${username}`);
    const loginRes = await fetch(`${HOSPILOT_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (!loginRes.ok) {
      const errText = await loginRes.text();
      console.error(`Login failed: ${loginRes.status} - ${errText}`);
      return res.status(loginRes.status).json({ error: `Login to Hospilot failed: ${errText || loginRes.statusText}` });
    }

    const loginData = await loginRes.json();
    const token = loginData.token;

    const prefixedGoal = `[CANDIDATE-Himanshu] ${goal.trim()}`;
    console.log(`[Backend] Creating session for goal: "${prefixedGoal}"`);

    const sessionRes = await fetch(`${HOSPILOT_BASE_URL}/api/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        goal: prefixedGoal,
        constraints: '',
        autonomous: false
      })
    });

    if (!sessionRes.ok) {
      const errText = await sessionRes.text();
      console.error(`Session creation failed: ${sessionRes.status} - ${errText}`);
      return res.status(sessionRes.status).json({ error: `Session creation failed: ${errText || sessionRes.statusText}` });
    }

    const sessionData = await sessionRes.json();
    console.log(`[Backend] Session created: ${sessionData.session_id}`);

    // Return token and session_id to frontend for iframe handoff postMessage
    return res.json({
      session_id: sessionData.session_id,
      status: sessionData.status,
      token: token
    });
  } catch (error) {
    console.error('Error in /api/session:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Route: Get Session (polling)
app.get(['/api/session/:id', '/api/widget-session/:id'], async (req, res) => {
  try {
    const sessionId = req.params.id;
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization token required' });
    }

    const sessionRes = await fetch(`${HOSPILOT_BASE_URL}/api/sessions/${sessionId}`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader
      }
    });

    if (!sessionRes.ok) {
      const errText = await sessionRes.text();
      console.error(`Session fetch failed: ${sessionRes.status} - ${errText}`);
      return res.status(sessionRes.status).json({ error: `Failed to fetch session: ${errText || sessionRes.statusText}` });
    }

    const sessionData = await sessionRes.json();
    return res.json(sessionData);
  } catch (error) {
    console.error('Error in /api/session/:id:', error);
    return res.status(500).json({ error: error.message });
  }
});

// For any other route, serve demo.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'demo.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
