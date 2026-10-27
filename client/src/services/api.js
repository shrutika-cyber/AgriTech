let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

async function request(method, url, body) {
  let res;
  try {
    res = await fetch(`/api${url}`, {
      method, credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'agrismart' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    const err = new Error('Cannot reach the server. Is it running? (Start it with: npm start)');
    err.fields = {};
    throw err;
  }
  let json = null;
  try { json = await res.json(); } catch { /* non-JSON response */ }
  if (!res.ok) {
    const err = new Error(json?.error?.message || `Request failed (${res.status})`);
    err.status = res.status;
    err.fields = json?.error?.fields || {};
    if (res.status === 401 && !url.startsWith('/auth/')) onUnauthorized();
    throw err;
  }
  return json?.data;
}

export const api = {
  get: (u) => request('GET', u),
  post: (u, b) => request('POST', u, b ?? {}),
  patch: (u, b) => request('PATCH', u, b),
  del: (u) => request('DELETE', u),
};
