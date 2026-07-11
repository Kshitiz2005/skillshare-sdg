const ZOOM_ACCOUNT_ID = process.env.ZOOM_ACCOUNT_ID;
const ZOOM_CLIENT_ID = process.env.ZOOM_CLIENT_ID;
const ZOOM_CLIENT_SECRET = process.env.ZOOM_CLIENT_SECRET;

let cachedToken = null;
let tokenExpiresAt = 0;

async function getZoomAccessToken() {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  if (!ZOOM_ACCOUNT_ID || !ZOOM_CLIENT_ID || !ZOOM_CLIENT_SECRET) {
    throw new Error('Zoom credentials are not configured (ZOOM_ACCOUNT_ID / ZOOM_CLIENT_ID / ZOOM_CLIENT_SECRET)');
  }

  const basicAuth = Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString('base64');
  const res = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${ZOOM_ACCOUNT_ID}`,
    {
      method: 'POST',
      headers: { Authorization: `Basic ${basicAuth}` },
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Zoom auth failed (${res.status}): ${body}`);
  }

  const data = await res.json();
  cachedToken = data.access_token;
  // Refresh a minute early so we never call the API with a token that
  // expires mid-request.
  tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;
  return cachedToken;
}

/**
 * Creates a scheduled Zoom meeting and returns the raw Zoom API response,
 * which includes `join_url` (share with both mentor and mentee) and
 * `start_url` (host-only link — do not expose to the mentee).
 */
async function createZoomMeeting({ topic, startTime, durationMinutes = 30, hostEmail }) {
  const token = await getZoomAccessToken();

  const res = await fetch(
    `https://api.zoom.us/v2/users/${hostEmail || 'me'}/meetings`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic,
        type: 2, // scheduled meeting
        start_time: new Date(startTime).toISOString(),
        duration: durationMinutes,
        timezone: 'UTC',
        settings: {
          join_before_host: true,
          waiting_room: false,
          approval_type: 2, // no registration required
          mute_upon_entry: true,
        },
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Zoom meeting creation failed (${res.status}): ${body}`);
  }

  return res.json();
}

module.exports = { createZoomMeeting };
