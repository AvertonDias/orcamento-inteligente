
"use client";

import React from 'react';
import { cn } from '@/lib/utils';

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

interface MonthSelectorProps {
  selectedMonth: number | 'all';
  onSelect: (month: number | 'all') => void;
}

export function MonthSelector({ selectedMonth, onSelect }: MonthSelectorProps) {
  return (
    <div className="bg-slate-800 text-white overflow-x-auto border-b">
      <div className="max-w-7xl mx-auto px-4 flex">
        <button 
          onClick={() => onSelect('all')} 
          className={cn(
            "px-4 py-3 text-sm font-medium border-b-2 border-transparent transition-colors whitespace-nowrap", 
            selectedMonth === 'all' && "border-primary text-primary bg-white/5"
          )}
        >
          Todos
        </button>
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
      </div>
    </div>
  );
}
