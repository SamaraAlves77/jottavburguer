// functions/api/github.js
// Cloudflare Pages Function — proxy seguro para API do GitHub

export async function onRequest(context) {
  const { request, env } = context;

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (request.method === 'OPTIONS') {
    return new Response('', { status: 204, headers });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método não permitido' }), { status: 405, headers });
  }

  const token = env.GITHUB_TOKEN;
  if (!token) {
    return new Response(JSON.stringify({ error: 'GITHUB_TOKEN não configurado' }), { status: 500, headers });
  }

  let body;
  try {
    body = await request.json();
  } catch(e) {
    return new Response(JSON.stringify({ error: 'Body inválido' }), { status: 400, headers });
  }

  const { caminho, metodo = 'GET', payload = null } = body;

  if (!caminho) {
    return new Response(JSON.stringify({ error: 'caminho obrigatório' }), { status: 400, headers });
  }

  const url = `https://api.github.com/repos/${caminho}`;

  const reqHeaders = {
    'Authorization': `token ${token}`,
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'Cloudflare-Pages-Function',
    'Content-Type': 'application/json',
  };

  const fetchOptions = {
    method: metodo,
    headers: reqHeaders,
  };

  if (payload && metodo !== 'GET') {
    fetchOptions.body = JSON.stringify(payload);
  }

  try {
    const resp = await fetch(url, fetchOptions);
    const data = await resp.json();
    return new Response(JSON.stringify(data), { status: resp.status, headers });
  } catch(e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
  }
}
