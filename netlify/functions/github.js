// netlify/functions/github.js
// Proxy seguro para API do GitHub — token nunca vai para o browser

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
      body: JSON.stringify({ error: 'GITHUB_TOKEN não configurado no servidor Netlify.' })
    };
  }

  try {
    const body    = event.body ? JSON.parse(event.body) : {};
    const caminho = body.caminho || '';
    const metodo  = body.metodo  || 'GET';
    const payload = body.payload || null;

    if (!caminho) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Caminho não informado.' })
      };
    }

    const url = `https://api.github.com/repos/${caminho}`;

    const options = {
      method: metodo,
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'Netlify-Function',
      }
    };

    if (payload && metodo !== 'GET') {
      options.body = JSON.stringify(payload);
    }

    const resp = await fetch(url, options);
    const data = await resp.json();

    return {
      statusCode: resp.status,
      headers,
      body: JSON.stringify(data)
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message })
    };
  }
};
