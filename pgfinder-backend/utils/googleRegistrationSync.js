const crypto = require('crypto');

const tokenCache = {
  accessToken: '',
  expiresAt: 0,
};

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

const base64Url = (value) => Buffer.from(value).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

const getPrivateKey = () => (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

const isConfigured = () => Boolean(
  process.env.GOOGLE_CLIENT_EMAIL
  && getPrivateKey()
  && process.env.GOOGLE_REGISTRATION_SHEET_ID
  && process.env.GOOGLE_DRIVE_REGISTRATION_FOLDER_ID
);

async function getAccessToken() {
  if (tokenCache.accessToken && tokenCache.expiresAt > Date.now() + 60000) {
    return tokenCache.accessToken;
  }

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = {
    iss: process.env.GOOGLE_CLIENT_EMAIL,
    scope: `${SHEETS_SCOPE} ${DRIVE_SCOPE}`,
    aud: GOOGLE_TOKEN_URL,
    exp: now + 3600,
    iat: now,
  };
  const unsignedJwt = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(claim))}`;
  const signature = crypto.createSign('RSA-SHA256').update(unsignedJwt).sign(getPrivateKey(), 'base64');
  const assertion = `${unsignedJwt}.${signature.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')}`;

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  if (!response.ok) {
    throw new Error(`Google token request failed with ${response.status}`);
  }

  const data = await response.json();
  tokenCache.accessToken = data.access_token;
  tokenCache.expiresAt = Date.now() + (Number(data.expires_in || 3000) * 1000);
  return tokenCache.accessToken;
}

const registrationRow = (user, loginMethod) => {
  const now = new Date();
  return [
    now.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }),
    now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false }),
    [user.userFname, user.userLname].filter(Boolean).join(' ') || user.userName || '',
    user.userEmail || '',
    user.contact || '',
    user.userType || '',
    user.city || user.assignedCity || '',
    user.state || user.assignedState || '',
    user.accountStatus || user.status || '',
    user.verificationStatus || user.approvalStatus || '',
    loginMethod || 'Password',
    user.addedOn || user.createdAt || now.toISOString(),
    user.updatedAt || now.toISOString(),
  ];
};

async function appendSheetRow(accessToken, user, loginMethod) {
  const sheetName = process.env.GOOGLE_REGISTRATION_SHEET_NAME || 'Registrations';
  const range = encodeURIComponent(`${sheetName}!A:M`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${process.env.GOOGLE_REGISTRATION_SHEET_ID}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ values: [registrationRow(user, loginMethod)] }),
  });
  if (!response.ok) throw new Error(`Google Sheets append failed with ${response.status}`);
}

async function uploadDriveRecord(accessToken, user, loginMethod) {
  const metadata = {
    name: `stayji-registration-${user._id || Date.now()}.json`,
    parents: [process.env.GOOGLE_DRIVE_REGISTRATION_FOLDER_ID],
    mimeType: 'application/json',
  };
  const payload = JSON.stringify({
    id: user._id,
    name: [user.userFname, user.userLname].filter(Boolean).join(' ') || user.userName || '',
    email: user.userEmail,
    phone: user.contact,
    role: user.userType,
    city: user.city || user.assignedCity,
    state: user.state || user.assignedState,
    status: user.accountStatus || user.status,
    verificationStatus: user.verificationStatus || user.approvalStatus,
    loginMethod,
    createdAt: user.addedOn || user.createdAt,
    updatedAt: user.updatedAt || new Date().toISOString(),
  }, null, 2);

  const boundary = `stayji_${crypto.randomBytes(8).toString('hex')}`;
  const body = [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    JSON.stringify(metadata),
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    payload,
    `--${boundary}--`,
  ].join('\r\n');

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-type': `multipart/related; boundary=${boundary}`,
    },
    body,
  });
  if (!response.ok) throw new Error(`Google Drive upload failed with ${response.status}`);
}

async function syncRegistration(user, { loginMethod = 'Password' } = {}) {
  if (!isConfigured()) return { skipped: true, reason: 'google_registration_sync_not_configured' };
  const accessToken = await getAccessToken();
  await Promise.all([
    appendSheetRow(accessToken, user, loginMethod),
    uploadDriveRecord(accessToken, user, loginMethod),
  ]);
  return { skipped: false };
}

module.exports = {
  syncRegistration,
  isGoogleRegistrationSyncConfigured: isConfigured,
};
