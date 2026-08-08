import type { NextApiRequest, NextApiResponse } from 'next';

// Proxy to backend endpoints added in feature branch
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const path = req.url?.replace('/api/proxy', '') || '';
  const backend = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || 'http://localhost:4000';
  const url = backend + path + (req.url?.includes('?') ? '' : '');

  const opts: any = {
    method: req.method,
    headers: { ...req.headers },
  };
  if (req.method !== 'GET' && req.body) {
    opts.body = JSON.stringify(req.body);
    opts.headers['Content-Type'] = 'application/json';
  }

  const r = await fetch(backend + path, opts);
  const text = await r.text();
  res.status(r.status).send(text);
}
