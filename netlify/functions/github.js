const https = require('https');

exports.handler = async function(event, context) {
  const allowedOrigin = '*';

  const responseHeaders = {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: responseHeaders, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: responseHeaders, body: JSON.stringify({ error: 'Método não permitido' }) };
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return { statusCode: 500, headers: responseHeaders, body: JSON.stringify({ error: 'GITHUB_TOKEN não configurado no Netlify' }) };
  }

  let parsed;
  try {
    parsed = JSON.parse(event.body || '{}');
  } catch(e) {
    return { statusCode: 400, headers: responseHeaders, body: JSON.stringify({ error: 'JSON inválido' }) };
  }

  const { caminho, metodo = 'GET', payload = null } = parsed;

  if (!caminho) {
    return { statusCode: 400, headers: responseHeaders, body: JSON.stringify({ error: 'caminho é obrigatório' }) };
  }

  const url = new URL(`https://api.github.com/repos/${caminho}`);

  const reqHeaders = {
    'Authorization': `token ${token}`,
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'Netlify-Function/1.0',
    'Content-Type': 'application/json'
  };

  return new Promise((resolve) => {
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: metodo,
      headers: reqHeaders
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        let data;
        try { data = JSON.parse(body); } catch(e) { data = { raw: body }; }
        resolve({
          statusCode: res.statusCode,
          headers: responseHeaders,
          body: JSON.stringify(data)
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        statusCode: 500,
        headers: responseHeaders,
        body: JSON.stringify({ error: err.message })
      });
    });

    if (payload && metodo !== 'GET') {
      req.write(JSON.stringify(payload));
    }

    req.end();
  });
};
