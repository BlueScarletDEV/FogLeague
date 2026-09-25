import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, X, Check, Sparkles, ExternalLink, Cpu } from 'lucide-react';
import { soundManager } from '../lib/audioManager';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { loginWithSteam } = useAuth();

  if (!isOpen) return null;

  const handleSteamRedirect = () => {
    soundManager.playPickSound();
    loginWithSteam();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#141417] border border-zinc-700/80 rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-[#18181c]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-faceit-orange/20 border border-faceit-orange/40 flex items-center justify-center text-faceit-orange">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase text-white tracking-wide">
                Connexion Sécurisée FogLeague
              </h3>
              <p className="text-[10px] text-zinc-400">
                Protocole Officiel Valve Steam OpenID 2.0 & HMAC-SHA256
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          <div className="space-y-5 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-[#1b2838] border border-[#2a475e] flex items-center justify-center shadow-lg">
              <span className="text-3xl">🎮</span>
            </div>

            <div>
              <h4 className="font-bold text-base text-white">
                Authentification Officielle Steam (Valve)
              </h4>
              <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto leading-relaxed">
                Vous allez être redirigé vers la page sécurisée <strong>steamcommunity.com</strong> pour vous identifier avec vos identifiants Steam et Steam Guard.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2.5 text-left">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Validation cryptographique Valve (check_authentication) + Scan VAC Ban en temps réel.</span>
            </div>

            <div className="p-3.5 rounded-xl bg-orange-950/30 border border-faceit-orange/40 text-orange-200 text-xs flex items-start gap-2.5 text-left">
              <ShieldCheck className="w-5 h-5 text-faceit-orange shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-white">Protection Anti-Usurpation Valve 100%</div>
                <div className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                  FogLeague ne stocke jamais votre mot de passe. L'authentification est scellée par jeton HMAC-SHA256 avec expiration TTL.
                </div>
              </div>
            </div>

            <button
              onClick={handleSteamRedirect}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-[#171a21] via-[#1b2838] to-[#2a475e] hover:from-[#1b2838] hover:to-[#386b8c] text-white font-black text-xs uppercase tracking-wider border border-[#66c0f4]/50 shadow-lg shadow-black/50 transition-all flex items-center justify-center gap-2.5 active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-[#66c0f4]" />
              <span>Se Connecter via Steam</span>
              <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
            </button>
          </div>

          {/* Security Footer Seal */}
          <div className="pt-3 border-t border-zinc-800 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
            <div className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <span>Valve OpenID 2.0 / SHA-256</span>
            </div>
            <span className="text-emerald-400 font-bold">Sécurité Certifiée</span>
          </div>
        </div>
      </div>
    </div>
  );
};
