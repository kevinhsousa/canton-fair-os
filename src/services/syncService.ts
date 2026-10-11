import { db } from './db';
import { Supplier, Product } from '../types';

export interface AuthUser {
  username: string;
  displayName: string;
  role: string;
}

const AUTH_STORAGE_KEY = 'canton_auth_user';

export function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveStoredUser(user: AuthUser) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
}

export function clearStoredUser() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

const LOCAL_TEAM: Record<string, { name: string; pass: string }> = {
  kevin: { name: 'Kevin de Sousa', pass: 'canton2026' },
  emerson: { name: 'Emerson', pass: 'emerson2026' },
  davi: { name: 'Davi', pass: 'davi2026' },
  thailan: { name: 'Thailan', pass: 'thailan2026' },
  amigo: { name: 'Convidado / Equipe', pass: 'china2026' },
};

export async function loginUser(username: string, password: string): Promise<AuthUser> {
  const u = username.trim().toLowerCase();
  const p = password.trim();

  // 1. Tentar validação via API
  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: u, password: p }),
    });

    if (res.ok) {
      const data = await res.json();
      const user: AuthUser = {
        username: data.username,
        displayName: data.displayName || data.username,
        role: data.role || 'member',
      };
      saveStoredUser(user);
      return user;
    }
  } catch (err) {
    console.warn('API de login indisponível, usando fallback local...', err);
  }

  // 2. Fallback de Segurança Offline no Pavilhão (sem internet na feira)
  if (p.toUpperCase() === 'CANTON2026' || (LOCAL_TEAM[u] && (LOCAL_TEAM[u].pass === p || p === 'canton2026'))) {
    const displayName = LOCAL_TEAM[u] ? LOCAL_TEAM[u].name : u ? u.charAt(0).toUpperCase() + u.slice(1) : 'Membro Equipe';
    const user: AuthUser = {
      username: u || 'convidado',
      displayName,
      role: u === 'kevin' ? 'admin' : 'member',
    };
    saveStoredUser(user);
    return user;
  }

  throw new Error('Usuário ou senha inválidos.');
}

export async function syncWithCloud(currentUser: AuthUser): Promise<{ success: boolean; message: string; count: { suppliers: number; products: number } }> {
  try {
    const localSuppliers = await db.suppliers.toArray();
    const localProducts = await db.products.toArray();

    const payload = {
      user: currentUser.displayName,
      suppliers: localSuppliers,
      products: localProducts,
    };

    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Falha de conexão com a nuvem (HTTP ${res.status})`);
    }

    const data = await res.json();
    if (!data.success && !data.suppliers) {
      throw new Error(data.message || 'Erro na resposta do Hub Central');
    }

    // Merge dos dados remotos de volta para o IndexedDB local
    const remoteSuppliers: Supplier[] = data.suppliers || [];
    const remoteProducts: Product[] = data.products || [];

    await db.transaction('rw', db.suppliers, db.products, async () => {
      for (const sup of remoteSuppliers) {
        const existing = await db.suppliers.where('syncId').equals(sup.syncId).first();
        if (existing) {
          await db.suppliers.update(existing.id!, {
            ...sup,
            id: existing.id,
          });
        } else {
          const { id, ...toAdd } = sup as any;
          await db.suppliers.add(toAdd);
        }
      }

      for (const prod of remoteProducts) {
        const existing = await db.products.where('syncId').equals(prod.syncId).first();
        if (existing) {
          await db.products.update(existing.id!, {
            ...prod,
            id: existing.id,
          });
        } else {
          const { id, ...toAdd } = prod as any;
          await db.products.add(toAdd);
        }
      }
    });

    return {
      success: true,
      message: 'Sincronizado com a equipe com sucesso!',
      count: {
        suppliers: remoteSuppliers.length,
        products: remoteProducts.length,
      },
    };
  } catch (err: any) {
    console.error('Erro na sincronização:', err);
    return {
      success: false,
      message: err.message || 'Erro ao sincronizar',
      count: { suppliers: 0, products: 0 },
    };
  }
}
