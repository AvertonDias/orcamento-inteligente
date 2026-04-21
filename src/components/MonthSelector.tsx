
"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { BarChart3 } from 'lucide-react';

const MONTHS = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

interface MonthSelectorProps {
  selectedMonth: number | 'annual';
  onSelect: (month: number | 'annual') => void;
}

export function MonthSelector({ selectedMonth, onSelect }: MonthSelectorProps) {
  return (
    <div className="bg-slate-800 text-white overflow-x-auto border-b sticky top-16 z-20 shadow-sm no-scrollbar">
      <div className="max-w-7xl mx-auto px-2 flex">
        {MONTHS.map((month, index) => (
          <button 
            key={month} 
            onClick={() => onSelect(index)} 
            className={cn(
              "px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium border-b-2 border-transparent transition-colors whitespace-nowrap", 
              selectedMonth === index && "border-primary text-primary bg-white/5 font-bold"
            )}
          >
            {month}
          </button>
        ))}
        
        <div className="w-px h-6 bg-slate-700 self-center mx-1 shrink-0" />
        
        <button 
          onClick={() => onSelect('annual')} 
          className={cn(
            "px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium border-b-2 border-transparent transition-colors whitespace-nowrap flex items-center gap-1.5", 
            selectedMonth === 'annual' && "border-primary text-primary bg-white/5 font-bold"
          )}
        >
          <BarChart3 className="h-3.5 w-3.5" />
          Anual
        </button>
      </div>
    </div>
  );
}
