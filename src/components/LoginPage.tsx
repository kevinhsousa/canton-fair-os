import React, { useState } from 'react';
import { Building2, Lock, User, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { loginUser, AuthUser } from '../services/syncService';

interface LoginPageProps {
  onLoginSuccess: (user: AuthUser) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('kevin');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Por favor, informe a senha de acesso.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const user = await loginUser(username, password);
      onLoginSuccess(user);
    } catch (err: any) {
      setError(err.message || 'Falha ao autenticar.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen bg-[#070D1E] text-canton-body flex flex-col justify-center items-center p-4 selection:bg-canton-gold selection:text-black">
      <div className="max-w-md w-full space-y-6">
        {/* Logo & Marca */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-canton-goldBright to-canton-gold flex items-center justify-center shadow-xl shadow-canton-gold/25">
            <Building2 className="w-8 h-8 text-black" />
          </div>
          <div>
            <h1 className="font-display font-extrabold text-canton-cream text-2xl tracking-tight">
              CANTON FAIR <span className="text-canton-gold">OS</span>
            </h1>
            <p className="text-xs text-canton-dim font-mono mt-0.5">
              Hub Central de Inteligência de Campo • Pazhou 2026
            </p>
          </div>
        </div>

        {/* Card de Login */}
        <div className="bg-canton-surface border border-canton-border rounded-2xl p-6 shadow-2xl space-y-5">
          <div className="border-b border-canton-borderSoft pb-3">
            <h2 className="font-display font-bold text-canton-cream text-base">
              Acesso da Equipe
            </h2>
            <p className="text-xs text-canton-dim mt-0.5">
              Entre com seu usuário para centralizar e sincronizar todos os fornecedores cadastrados.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-canton-gold block mb-1.5">
                Seu Nome ou Usuário
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-canton-dim" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ex: kevin, amigo, felipe..."
                  className="w-full bg-canton-dark border border-canton-border rounded-xl pl-9 pr-3 py-2.5 text-xs text-canton-cream focus:outline-none focus:border-canton-gold font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-canton-gold block mb-1.5">
                Senha de Acesso
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-canton-dim" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Senha pessoal ou senha mestra"
                  className="w-full bg-canton-dark border border-canton-border rounded-xl pl-9 pr-3 py-2.5 text-xs text-canton-cream focus:outline-none focus:border-canton-gold font-mono"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-950/40 border border-red-500/40 rounded-xl p-3 text-xs text-red-200 font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-canton-goldBright to-canton-gold text-black font-display font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-canton-gold/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? (
                <span>Autenticando...</span>
              ) : (
                <>
                  Entrar na Plataforma <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Atalhos de Acesso Rápido para Amigos */}
          <div className="pt-3 border-t border-canton-borderSoft space-y-2">
            <span className="text-[10px] font-mono uppercase text-canton-dim block text-center">
              Acesso Rápido da Equipe:
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <button
                type="button"
                onClick={() => handleQuickLogin('kevin', 'canton2026')}
                className="bg-canton-dark hover:bg-canton-navy border border-canton-borderSoft rounded-lg p-2 text-left transition-colors"
              >
                <div className="text-canton-cream font-bold">Kevin de Sousa</div>
                <div className="text-[10px] text-canton-gold">Admin</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('amigo', 'china2026')}
                className="bg-canton-dark hover:bg-canton-navy border border-canton-borderSoft rounded-lg p-2 text-left transition-colors"
              >
                <div className="text-canton-cream font-bold">Convidado / Amigo</div>
                <div className="text-[10px] text-canton-dim">Equipe</div>
              </button>
            </div>
            <p className="text-[10px] text-canton-dim text-center">
              Dica: a senha mestra <strong className="text-canton-gold font-mono">CANTON2026</strong> libera acesso para qualquer nome.
            </p>
          </div>
        </div>

        {/* Rodapé Seguro */}
        <div className="flex items-center justify-center gap-2 text-xs text-canton-dim">
          <ShieldCheck className="w-4 h-4 text-canton-gold" />
          <span>Sincronização Criptografada • Modo 100% Offline no Pavilhão</span>
        </div>
      </div>
    </div>
  );
};
