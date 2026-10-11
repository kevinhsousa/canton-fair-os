export const config = {
  runtime: 'edge',
};

const AUTHORIZED_USERS: Record<string, { name: string; pass: string; role: string }> = {
  kevin: { name: 'Kevin de Sousa', pass: 'canton2026', role: 'admin' },
  emerson: { name: 'Emerson', pass: 'emerson2026', role: 'member' },
  davi: { name: 'Davi', pass: 'davi2026', role: 'member' },
  thailan: { name: 'Thailan', pass: 'thailan2026', role: 'member' },
  amigo: { name: 'Convidado / Equipe', pass: 'china2026', role: 'member' },
  compras: { name: 'Time de Compras', pass: 'canton2026', role: 'member' },
};
const MASTER_PASSWORD = 'CANTON2026';

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const u = (body.username || '').trim().toLowerCase();
    const p = (body.password || '').trim();

    if (p.toUpperCase() === MASTER_PASSWORD) {
      const displayName = u ? u.charAt(0).toUpperCase() + u.slice(1) : 'Membro da Equipe';
      return new Response(
        JSON.stringify({
          success: true,
          username: u || 'convidado',
          displayName,
          role: 'member',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (u in AUTHORIZED_USERS && (AUTHORIZED_USERS[u].pass === p || p === 'canton2026')) {
      return new Response(
        JSON.stringify({
          success: true,
          username: u,
          displayName: AUTHORIZED_USERS[u].name,
          role: AUTHORIZED_USERS[u].role,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, message: 'Usuário ou senha incorretos.' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
