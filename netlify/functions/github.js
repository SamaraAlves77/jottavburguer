// netlify/functions/github.js
// Função serverless — proxy seguro para a API do GitHub
// O token nunca vai para o browser — fica só no servidor

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Preflight CORS
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Token não configurado no servidor.' })
    };
  }

  try {
    const body   = event.body ? JSON.parse(event.body) : {};
    const caminho = body.caminho || '';
    const metodo  = body.metodo  || 'GET';
    const payload = body.payload  || null;

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
      }
    };

    if (payload && (metodo === 'PUT' || metodo === 'POST')) {
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
