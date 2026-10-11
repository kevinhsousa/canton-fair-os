export const config = {
  maxDuration: 15,
};

const VPS_SYNC_URL = process.env.VPS_SYNC_URL || 'http://159.195.18.49:8078/api/sync';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const response = await fetch(VPS_SYNC_URL, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        throw new Error(`VPS retornou ${response.status}`);
      }
      const data = await response.json();
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const payload = req.body;
      const response = await fetch(VPS_SYNC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: typeof payload === 'string' ? payload : JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`VPS retornou ${response.status}`);
      }
      const data = await response.json();
      return res.status(200).json(data);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Erro na sincronização Vercel -> VPS:', error);
    return res.status(502).json({
      success: false,
      message: 'Não foi possível conectar ao Hub Central VPS. O app continuará operando normalmente em modo offline local.',
      error: error.message,
    });
  }
}
