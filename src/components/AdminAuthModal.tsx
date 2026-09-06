import React, { useState, useEffect, useRef } from 'react';
import { Lock, Unlock, ShieldAlert, X, KeyRound, ArrowRight } from 'lucide-react';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError(false);
      setIsSuccess(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pin === '0409') {
      setError(false);
      setIsSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 500);
    } else {
      setError(true);
      setPin('');
      inputRef.current?.focus();
    }
  };

  const handleKeypadPress = (val: string) => {
    if (pin.length < 4) {
      const nextPin = pin + val;
      setPin(nextPin);
      setError(false);
      if (nextPin.length === 4) {
        if (nextPin === '0409') {
          setError(false);
          setIsSuccess(true);
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 500);
        } else {
          setTimeout(() => {
            setError(true);
            setPin('');
          }, 150);
        }
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div
        id="admin-auth-modal"
        className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden text-neutral-100 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                isSuccess
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
              }`}
            >
              {isSuccess ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                  Segurança
                </span>
              </div>
              <h2 className="text-base font-bold text-white">Acesso de Administrador</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          <div className="text-center space-y-1.5">
            <p className="text-sm font-semibold text-neutral-200">
              Digite a senha de administrador
            </p>
            <p className="text-xs text-neutral-400 max-w-xs mx-auto leading-relaxed">
              Necessária para fazer upload de novos vídeos, editar informações e excluir séries e episódios.
            </p>
          </div>

          {/* PIN Input / Display */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex justify-center items-center gap-3 my-2">
              {[0, 1, 2, 3].map((index) => {
                const isFilled = pin.length > index;
                return (
                  <div
                    key={index}
                    className={`w-12 h-14 rounded-2xl flex items-center justify-center text-xl font-bold border-2 transition-all ${
                      error
                        ? 'border-rose-500 bg-rose-500/10 text-rose-400 animate-shake'
                        : isSuccess
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                        : isFilled
                        ? 'border-blue-500 bg-blue-500/10 text-white shadow-md shadow-blue-500/20'
                        : 'border-neutral-800 bg-neutral-950/80 text-neutral-500'
                    }`}
                  >
                    {isFilled ? '•' : ''}
                  </div>
                );
              })}
            </div>

            {/* Hidden actual input for keyboard typing */}
            <input
              ref={inputRef}
              type="password"
              maxLength={4}
              value={pin}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                setPin(val);
                setError(false);
                if (val === '0409') {
                  setError(false);
                  setIsSuccess(true);
                  setTimeout(() => {
                    onSuccess();
                    onClose();
                  }, 500);
                } else if (val.length === 4) {
                  setError(true);
                  setTimeout(() => setPin(''), 600);
                }
              }}
              className="sr-only"
              autoComplete="off"
            />

            {/* Feedback message */}
            <div className="h-6 flex items-center justify-center text-center">
              {error ? (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-400 animate-shake">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Senha incorreta. Tente novamente!</span>
                </div>
              ) : isSuccess ? (
                <span className="text-xs font-semibold text-emerald-400">
                  Senha correta! Desbloqueando modo admin...
                </span>
              ) : (
                <span className="text-[11px] text-neutral-500">
                  Dica: use o teclado ou o teclado numérico abaixo
                </span>
              )}
            </div>

            {/* Numeric Onscreen Keypad */}
            <div className="grid grid-cols-3 gap-2.5 max-w-[260px] mx-auto pt-1">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleKeypadPress(digit)}
                  className="h-12 rounded-2xl bg-neutral-800/80 hover:bg-neutral-700 text-base font-bold text-neutral-100 transition-colors cursor-pointer border border-neutral-700/60 active:scale-95"
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPin('')}
                className="h-12 rounded-2xl bg-neutral-950/60 hover:bg-neutral-800 text-xs font-semibold text-neutral-400 transition-colors cursor-pointer border border-neutral-800"
              >
                Limpar
              </button>
              <button
                type="button"
                onClick={() => handleKeypadPress('0')}
                className="h-12 rounded-2xl bg-neutral-800/80 hover:bg-neutral-700 text-base font-bold text-neutral-100 transition-colors cursor-pointer border border-neutral-700/60 active:scale-95"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                className="h-12 rounded-2xl bg-neutral-950/60 hover:bg-neutral-800 text-xs font-semibold text-neutral-400 transition-colors cursor-pointer border border-neutral-800"
              >
                ←
              </button>
            </div>

            {/* Submit Button */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={pin.length !== 4 || isSuccess}
                className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
                <span>Entrar como Administrador</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
