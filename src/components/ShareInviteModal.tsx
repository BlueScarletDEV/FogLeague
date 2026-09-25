import React, { useState } from 'react';
import { Share2, Copy, Check, Send, Globe, Radio, Sparkles, X, MessageSquare } from 'lucide-react';
import { soundManager } from '../lib/audioManager';

interface ShareInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShareInviteModal: React.FC<ShareInviteModalProps> = ({ isOpen, onClose }) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookStatus, setWebhookStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001';

  const handleCopy = () => {
    soundManager.playPickSound();
    navigator.clipboard.writeText(currentUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleTestDiscordWebhook = async () => {
    if (!webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
      alert('Veuillez entrer une URL de Webhook Discord valide.');
      return;
    }

    setWebhookStatus('sending');
    soundManager.playPickSound();

    try {
      const payload = {
        username: 'FogLeague Bot',
        avatar_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=150',
        embeds: [
          {
            title: '🔥 Nouveau Match Compétitif Prêt sur FogLeague !',
            description: 'Un duel au Shack ou match 4v1 vient d\'être lancé dans l\'Arène du Brouillard.',
            color: 16733440, // Fog Orange (#FF5500)
            fields: [
              { name: 'Format', value: '1v1 Shack Duel', inline: true },
              { name: 'Arbitrage', value: 'Arbitre Homologué & Consensus', inline: true },
              { name: 'Rejoindre la Ligue', value: `[Cliquer ici pour jouer](${currentUrl})`, inline: false },
            ],
            footer: { text: 'FogLeague • Plateforme Compétitive Dead by Daylight' },
            timestamp: new Date().toISOString(),
          }
        ]
      };

      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      setWebhookStatus('success');
      soundManager.playVictory();
    } catch (e) {
      setWebhookStatus('error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#141417] border border-zinc-700/80 rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-[#18181c]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-faceit-orange/20 border border-faceit-orange/40 flex items-center justify-center text-faceit-orange">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase text-white tracking-wide">
                Inviter des Joueurs & Lancer la Communauté
              </h3>
              <p className="text-[10px] text-zinc-400">
                Partage ton lien pour affronter tes potes ou ta communauté
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

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Share Link Box */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
              1. Lien Direct de la Plateforme à Partager
            </label>
            <div className="flex items-center gap-2 bg-[#1b1b20] border border-zinc-700 p-2.5 rounded-2xl">
              <Globe className="w-4 h-4 text-faceit-orange shrink-0 ml-1" />
              <input
                type="text"
                readOnly
                value={currentUrl}
                className="flex-1 bg-transparent text-xs font-mono text-white focus:outline-none select-all"
              />
              <button
                onClick={handleCopy}
                className="px-4 py-2 rounded-xl bg-faceit-orange hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider shadow-faceit-glow transition-all flex items-center gap-1.5 shrink-0"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4 text-white" />
                    <span>Lien Copié !</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copier</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-zinc-500">
              Envoie ce lien dans tes salons Discord ou à tes adversaires pour qu'ils rejoignent directement le matchmaking en ligne.
            </p>
          </div>

          {/* Discord Webhook Integration */}
          <div className="space-y-3 pt-4 border-t border-zinc-800">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#5865F2]" />
              <label className="text-xs font-bold text-white uppercase tracking-wider">
                2. Connecter un Serveur Discord (Webhooks)
              </label>
            </div>
            <p className="text-xs text-zinc-400">
              Colle l'URL d'un webhook Discord pour que FogLeague annonce automatiquement les nouveaux matchs et résultats dans ton salon Discord :
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="https://discord.com/api/webhooks/..."
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="flex-1 bg-[#18181c] border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#5865F2]"
              />
              <button
                onClick={handleTestDiscordWebhook}
                disabled={webhookStatus === 'sending'}
                className="px-4 py-2 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Tester</span>
              </button>
            </div>

            {webhookStatus === 'success' && (
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-700 text-emerald-300 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Message de test envoyé sur ton Discord avec succès !</span>
              </div>
            )}
            {webhookStatus === 'error' && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-700 text-red-300 text-xs">
                Erreur lors de l'envoi vers Discord. Vérifie que l'URL du webhook est valide.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
