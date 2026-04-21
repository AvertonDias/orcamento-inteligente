
"use client";

import React from 'react';
import { Input } from '@/components/ui/input';
import { Search, Filter, X, Calendar as CalendarIcon } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface FiltersProps {
  search: string;
  setSearch: (val: string) => void;
  category: string;
  setCategory: (val: string) => void;
  type: string;
  setType: (val: string) => void;
  startDate: string;
  setStartDate: (val: string) => void;
  endDate: string;
  setEndDate: (val: string) => void;
  onClear: () => void;
  categories: string[];
}

export function TransactionFilters({
  search,
  setSearch,
  category,
  setCategory,
  type,
  setType,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  onClear,
  categories
}: FiltersProps) {
  const hasFilters = search || category !== 'all' || type !== 'all' || startDate || endDate;

  return (
    <div className="space-y-4 w-full">
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar transações..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white"
          />
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-full sm:w-[130px] bg-white">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Tipos</SelectItem>
              <SelectItem value="receita">Receitas</SelectItem>
              <SelectItem value="despesa">Despesas</SelectItem>
            </SelectContent>
          </Select>

          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full sm:w-[150px] bg-white">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Categorias</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-end gap-3 w-full">
        <div className="grid grid-cols-2 gap-3 flex-1 w-full">
          <div className="space-y-1.5">
            <Label htmlFor="startDate" className="text-[10px] font-bold text-slate-500 uppercase px-1">De</Label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="pl-9 bg-white h-9 text-xs"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="endDate" className="text-[10px] font-bold text-slate-500 uppercase px-1">Até</Label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="pl-9 bg-white h-9 text-xs"
              />
            </div>
          </div>
        </div>

        {hasFilters && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClear} 
            className="h-9 gap-2 text-muted-foreground hover:text-rose-500 shrink-0"
          >
            <X className="h-4 w-4" />
            <span className="text-xs font-bold uppercase">Limpar</span>
          </Button>
        )}
      </div>
    </div>
  );
}
