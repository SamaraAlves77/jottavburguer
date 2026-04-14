// netlify/functions/github.js
// Proxy seguro para API do GitHub — token nunca vai para o browser

const https = require('https');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, PUT, POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'GITHUB_TOKEN não configurado.' })
    };
  }

  let body;
  try {
    body = event.body ? JSON.parse(event.body) : {};
  } catch(e) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Body inválido.' }) };
  }

  const caminho = body.caminho || '';
  const metodo  = body.metodo  || 'GET';
  const payload = body.payload || null;

  if (!caminho) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Caminho obrigatório.' }) };
  }

  const url = `https://api.github.com/repos/${caminho}`;

  const reqHeaders = {
    'Authorization': `token ${token}`,
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
    'User-Agent': 'Netlify-Serverless-Function',
  };

  // Usa node-fetch compatível com todas as versões do Node no Netlify
  const response = await new Promise((resolve, reject) => {
    const options = {
      method: metodo,
      headers: reqHeaders,
    };

    const parsedUrl = new URL(url);
    const reqOptions = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: metodo,
      headers: reqHeaders,
    };

    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch(e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);

    if (payload && metodo !== 'GET') {
      req.write(JSON.stringify(payload));
    }

    req.end();
  });

  return {
    statusCode: response.status,
    headers,
    body: JSON.stringify(response.body)
  };
};
