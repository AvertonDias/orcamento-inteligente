'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X, Smartphone, Share } from 'lucide-react';

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detecta se é iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    // Para Android/Desktop
    window.addEventListener('beforeinstallprompt', handler);

    // Para iOS, mostramos após alguns segundos se não estiver instalado
    if (isIOSDevice && !window.matchMedia('(display-mode: standalone)').matches) {
      const timer = setTimeout(() => setIsVisible(true), 3000);
      return () => clearTimeout(timer);
    }

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsVisible(false);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsVisible(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-4 right-4 z-[100] md:left-auto md:right-6 md:w-96 animate-in slide-in-from-bottom-10 duration-500">
      <div className="bg-white border-2 border-primary/20 p-5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex flex-col gap-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2.5 rounded-xl">
              <Smartphone className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-800 leading-tight">Instalar Aplicativo</p>
              <p className="text-xs text-slate-500 mt-1">Acesse o Orçamento Inteligente direto da sua tela inicial.</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsVisible(false)} 
            className="h-8 w-8 -mt-1 -mr-1 text-slate-400 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {isIOS ? (
          <div className="bg-slate-50 p-3 rounded-lg space-y-2">
            <p className="text-[11px] font-medium text-slate-600 flex items-center gap-2">
              1. Toque no ícone de compartilhar <Share className="h-3 w-3 inline" />
            </p>
            <p className="text-[11px] font-medium text-slate-600">
              2. Role para baixo e toque em <b>"Adicionar à Tela de Início"</b>
            </p>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button 
              onClick={handleInstallClick} 
              className="flex-1 font-bold gap-2 shadow-lg shadow-primary/20"
            >
              <Download className="h-4 w-4" />
              Instalar Agora
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsVisible(false)}
              className="text-xs text-slate-500 font-bold border-slate-200"
            >
              Depois
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
