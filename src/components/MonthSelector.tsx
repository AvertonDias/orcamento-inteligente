
"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { BarChart3, Settings } from 'lucide-react';

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

interface MonthSelectorProps {
  selectedMonth: number | 'annual' | 'settings';
  onSelect: (month: number | 'annual' | 'settings') => void;
}

export function MonthSelector({ selectedMonth, onSelect }: MonthSelectorProps) {
  return (
    <div className="bg-slate-800 text-white overflow-x-auto border-b sticky top-16 z-10 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 flex">
        {MONTHS.map((month, index) => (
          <button 
            key={month} 
            onClick={() => onSelect(index)} 
            className={cn(
              "px-4 py-3 text-sm font-medium border-b-2 border-transparent transition-colors whitespace-nowrap", 
              selectedMonth === index && "border-primary text-primary bg-white/5"
            )}
          >
            {month}
          </button>
        ))}
        
        <div className="w-px h-6 bg-slate-700 self-center mx-2 shrink-0" />
        
        <button 
          onClick={() => onSelect('annual')} 
          className={cn(
            "px-4 py-3 text-sm font-medium border-b-2 border-transparent transition-colors whitespace-nowrap flex items-center gap-2", 
            selectedMonth === 'annual' && "border-primary text-primary bg-white/5"
          )}
        >
          <BarChart3 className="h-4 w-4" />
          Resumo Anual
        </button>

        <button 
          onClick={() => onSelect('settings')} 
          className={cn(
            "px-4 py-3 text-sm font-medium border-b-2 border-transparent transition-colors whitespace-nowrap flex items-center gap-2", 
            selectedMonth === 'settings' && "border-primary text-primary bg-white/5"
          )}
        >
          <Settings className="h-4 w-4" />
          Configurações
        </button>
      </div>
    </div>
  );
}
