
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tag, Plus, Trash2, RotateCcw, Mail } from 'lucide-react';
import { User } from 'firebase/auth';

interface SettingsViewProps {
  user: User | null;
  categories: string[];
  onAddCategory: (name: string) => void;
  onRemoveCategory: (name: string) => void;
  onResetCategories: () => void;
}

export function SettingsView({ user, categories, onAddCategory, onRemoveCategory, onResetCategories }: SettingsViewProps) {
  const [newCategoryName, setNewCategoryName] = useState('');

  const handleAdd = () => {
    if (newCategoryName.trim()) {
      onAddCategory(newCategoryName.trim());
      setNewCategoryName('');
    }
  };

  return (
    <div className="max-w-4xl grid gap-6 md:grid-cols-2">
      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="text-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-primary" />
              Categorias
            </div>
            <Button variant="ghost" size="sm" onClick={onResetCategories} className="h-8 text-xs gap-1">
              <RotateCcw className="h-3 w-3" />
              Resetar
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input 
              placeholder="Nova categoria..." 
              value={newCategoryName} 
              onChange={(e) => setNewCategoryName(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()} 
            />
            <Button onClick={handleAdd} size="icon"><Plus className="h-4 w-4" /></Button>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            {categories.map(cat => (
              <Badge key={cat} variant="secondary" className="px-3 py-1 text-sm font-medium flex items-center gap-1 group">
                {cat}
                <button onClick={() => onRemoveCategory(cat)} className="hover:text-destructive text-muted-foreground ml-1">
                  <Trash2 className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-md h-fit">
        <CardHeader><CardTitle className="text-xl">Perfil</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-full"><Mail className="h-6 w-6 text-primary" /></div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="text-lg font-bold">{user?.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
