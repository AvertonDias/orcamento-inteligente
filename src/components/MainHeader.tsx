
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { TransactionDialog } from '@/components/TransactionDialog';
import { CSVImporter } from '@/components/CSVImporter';
import { Auth, signOut } from 'firebase/auth';
import { Transaction } from '@/app/lib/types';
import Image from 'next/image';

interface MainHeaderProps {
  auth: Auth | null;
  categories: string[];
  onAdd: (data: any) => void;
  onImport: (transactions: Transaction[]) => void;
}

export function MainHeader({ auth, categories, onAdd, onImport }: MainHeaderProps) {
  const handleLogout = () => {
    if (auth) signOut(auth);
  };

  return (
    <header className="bg-white border-b sticky top-0 z-20 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative h-8 w-8 overflow-hidden rounded-lg">
            <Image 
              src="/Logo.png" 
              alt="Logo" 
              fill
              className="object-cover"
            />
          </div>
          <h1 className="text-xl font-bold text-primary">Orçamento Inteligente</h1>
        </div>
        <div className="flex items-center gap-3">
          <TransactionDialog onAdd={onAdd} categories={categories} />
          <CSVImporter onImport={onImport} />
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
