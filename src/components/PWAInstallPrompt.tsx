
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X, Smartphone } from 'lucide-react';

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      // Impede que o navegador mostre o prompt padrão automaticamente
      e.preventDefault();
      // Guarda o evento para disparar depois
      setDeferredPrompt(e);
      // Mostra o nosso banner personalizado
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Verifica se já está instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsVisible(false);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Mostra o prompt nativo de instalação
    deferredPrompt.prompt();

    // Aguarda a resposta do usuário
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('Usuário aceitou a instalação');
    }

    setDeferredPrompt(null);
    setIsVisible(false);
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
      </div>
    </div>
  );
}
