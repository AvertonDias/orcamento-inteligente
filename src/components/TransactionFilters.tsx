
"use client";

import React from 'react';
import { Input } from '@/components/ui/input';
import { Search, X, ArrowDownWideNarrow, ArrowUpWideNarrow, Filter } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface FiltersProps {
  search: string;
  setSearch: (val: string) => void;
  category: string;
  setCategory: (val: string) => void;
  type: string;
  setType: (val: string) => void;
  sortOrder: 'asc' | 'desc';
  setSortOrder: (val: 'asc' | 'desc') => void;
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
  sortOrder,
  setSortOrder,
  onClear,
  categories
}: FiltersProps) {
  const hasFilters = search || category !== 'all' || type !== 'all';
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="space-y-3 w-full">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white h-10 text-sm"
          />
        </div>
        <Button 
          variant="outline" 
          size="icon" 
          className={`shrink-0 sm:hidden h-10 w-10 ${hasFilters ? 'border-primary text-primary bg-primary/5' : ''}`}
          onClick={() => setIsOpen(!isOpen)}
        >
          <Filter className="h-4 w-4" />
        </Button>
      </div>
      
      <div className={`${isOpen ? 'block' : 'hidden'} sm:block space-y-3`}>
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="bg-white h-9 text-xs">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Tipos</SelectItem>
              <SelectItem value="receita">Receitas</SelectItem>
              <SelectItem value="despesa">Despesas</SelectItem>
            </SelectContent>
          </Select>

          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="bg-white h-9 text-xs">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Categorias</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortOrder} onValueChange={(val: any) => setSortOrder(val)}>
            <SelectTrigger className="bg-white h-9 text-xs col-span-2 sm:w-[180px]">
              <div className="flex items-center gap-2">
                {sortOrder === 'desc' ? <ArrowDownWideNarrow className="h-3.5 w-3.5 text-primary" /> : <ArrowUpWideNarrow className="h-3.5 w-3.5 text-primary" />}
                <SelectValue placeholder="Ordenar" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Mais recentes primeiro</SelectItem>
              <SelectItem value="asc">Mais antigos (Dia 01+)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {hasFilters && (
          <div className="flex justify-end">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClear} 
              className="h-8 gap-1.5 text-muted-foreground hover:text-rose-500"
            >
              <X className="h-3.5 w-3.5" />
              <span className="text-[10px] font-bold uppercase">Limpar filtros</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
