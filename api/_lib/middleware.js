/**
 * Middleware helper untuk Vercel serverless functions
 */

function setCors(res) {
  const origin = process.env.FRONTEND_URL || 'http://localhost:5173';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  return res;
}

function handleOptions(req, res) {
  if (req.method === 'OPTIONS') {
    setCors(res);
    res.status(200).end();
    return true;
  }
  return false;
}

function sendJson(res, data, status = 200) {
  setCors(res);
  res.status(status).json(data);
}

function sendError(res, error, status = 500) {
  setCors(res);
  const message = typeof error === 'string' ? error : error?.message || 'Internal server error';
  res.status(status).json({ error: message });
}

module.exports = { setCors, handleOptions, sendJson, sendError };
