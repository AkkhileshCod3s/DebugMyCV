const BASE = '/api';

async function request(path, { method = 'GET', body, formData, signal } = {}) {
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';

  let payload;
  if (formData) payload = formData;
  else if (body) payload = JSON.stringify(body);

  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      credentials: 'include',
      headers,
      body: payload,
      signal,
    });
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
    const e = new Error('Network error — could not reach the server.');
    e.status = 0;
    throw e;
  }

  let data = {};
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (!res.ok) {
    const e = new Error(data?.message || `Request failed (${res.status}).`);
    e.status = res.status;
    e.details = data?.details;
    throw e;
  }
  return data;
}

export const api = {
  get: (path, opts) => request(path, opts),
  post: (path, body, opts) => request(path, { ...opts, method: 'POST', body }),
  patch: (path, body, opts) => request(path, { ...opts, method: 'PATCH', body }),
  del: (path, opts) => request(path, { ...opts, method: 'DELETE' }),
  upload: (path, formData, opts) => request(path, { ...opts, method: 'POST', formData }),
};
