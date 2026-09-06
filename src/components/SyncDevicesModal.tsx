import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  QrCode,
  Copy,
  Check,
  X,
  Wifi,
  Server,
  RefreshCw,
  ExternalLink,
  Laptop,
  CheckCircle2,
} from 'lucide-react';

interface SyncDevicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshData: () => Promise<void>;
  isSyncing: boolean;
}

export const SyncDevicesModal: React.FC<SyncDevicesModalProps> = ({
  isOpen,
  onClose,
  onRefreshData,
  isSyncing,
}) => {
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [justRefreshed, setJustRefreshed] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShareUrl(window.location.href);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleManualSync = async () => {
    await onRefreshData();
    setJustRefreshed(true);
    setTimeout(() => setJustRefreshed(false), 3000);
  };

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=10&data=${encodeURIComponent(
    shareUrl || 'https://localhost:3000'
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div
        id="sync-devices-modal"
        className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden my-auto text-neutral-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Sincronizar com Celular
              </h2>
              <p className="text-xs text-neutral-400">
                Acesse o mesmo catálogo em qualquer celular, tablet ou PC
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Indicator */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-800/40 text-xs">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="font-semibold text-emerald-300">
                Servidor Compartilhado Conectado
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-[11px]">
              <Server className="w-3.5 h-3.5" />
              <span>Sincronização Ativa</span>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="flex flex-col items-center justify-center p-5 bg-neutral-950/70 border border-neutral-800/80 rounded-2xl space-y-3 text-center">
            <div className="p-2.5 bg-white rounded-2xl shadow-lg border border-neutral-200">
              <img
                src={qrCodeUrl}
                alt="QR Code para conectar celular"
                className="w-40 h-40 object-contain rounded-lg"
              />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-neutral-200">
                <QrCode className="w-4 h-4 text-blue-400" />
                <span>Aponte a câmera do celular para o QR Code</span>
              </div>
              <p className="text-[11px] text-neutral-400 max-w-xs">
                O site abrirá no celular conectado diretamente a este mesmo catálogo e servidor.
              </p>
            </div>
          </div>

          {/* Share Link Input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-300 flex items-center justify-between">
              <span>Ou copie o link direto:</span>
              {copied && (
                <span className="text-emerald-400 flex items-center gap-1 text-[11px] font-bold">
                  <Check className="w-3.5 h-3.5" /> Link copiado!
                </span>
              )}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                onClick={(e) => (e.target as HTMLInputElement).select()}
                className="flex-1 px-3.5 py-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-xs text-neutral-300 font-mono select-all focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 shadow-md shadow-blue-900/20"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>
          </div>

          {/* Devices info banner */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 bg-neutral-800/40 rounded-xl border border-neutral-800 flex items-center gap-2.5">
              <Laptop className="w-5 h-5 text-blue-400 shrink-0" />
              <div className="text-[11px]">
                <div className="font-bold text-neutral-200">Computador</div>
                <div className="text-neutral-400">Adiciona vídeos</div>
              </div>
            </div>
            <div className="p-3 bg-neutral-800/40 rounded-xl border border-neutral-800 flex items-center gap-2.5">
              <Smartphone className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="text-[11px]">
                <div className="font-bold text-neutral-200">Celular</div>
                <div className="text-neutral-400">Assiste em tempo real</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-800 bg-neutral-900/80">
          <button
            type="button"
            onClick={handleManualSync}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Sincronizando...' : 'Forçar Atualização'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-white rounded-xl transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
