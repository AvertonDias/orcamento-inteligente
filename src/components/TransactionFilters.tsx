"use client";

import React from 'react';
import { Input } from '@/components/ui/input';
import { Search, Filter, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';

interface FiltersProps {
  search: string;
  setSearch: (val: string) => void;
  category: string;
  setCategory: (val: string) => void;
  type: string;
  setType: (val: string) => void;
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
  onClear,
  categories
}: FiltersProps) {
  const hasFilters = search || category !== 'all' || type !== 'all';

  return (
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
          <SelectTrigger className="w-[130px] bg-white">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Tipos</SelectItem>
            <SelectItem value="receita">Receitas</SelectItem>
            <SelectItem value="despesa">Despesas</SelectItem>
          </SelectContent>
        </Select>

        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[150px] bg-white">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Categorias</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button variant="ghost" size="icon" onClick={onClear} className="shrink-0 text-muted-foreground">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}