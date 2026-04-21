
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { Transaction, TransactionType } from '@/app/lib/types';
import { suggestTransactionCategory } from '@/ai/flows/sugestao-categoria-transacao';
import { useToast } from '@/hooks/use-toast';

interface CSVImporterProps {
  onImport: (transactions: Transaction[]) => void;
}

export function CSVImporter({ onImport }: CSVImporterProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();

    reader.onload = async (event) => {
      const content = event.target?.result as string;
      const lines = content.split('\n');
      const newTransactions: Transaction[] = [];

      // Skip header if it exists
      const startIndex = lines[0].toLowerCase().includes('data') || lines[0].toLowerCase().includes('valor') ? 1 : 0;

      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Naive CSV split, supporting comma or semicolon
        const parts = line.split(/[;,]/);
        if (parts.length < 3) continue;

        const date = parts[0];
        const description = parts[1];
        const amountStr = parts[2].replace(',', '.').replace(/[^\d.-]/g, '');
        const amount = parseFloat(amountStr);

        if (isNaN(amount)) continue;

        const type: TransactionType = amount >= 0 ? 'receita' : 'despesa';
        
        // Use AI to suggest category
        let category = 'Outros';
        try {
          const suggestion = await suggestTransactionCategory({
            description: description,
          });
          category = suggestion.suggestedCategory;
        } catch (error) {
          console.error("AI suggestion failed", error);
        }

        newTransactions.push({
          id: Math.random().toString(36).substr(2, 9),
          date,
          description,
          amount: Math.abs(amount),
          category,
          type
        });
      }

      onImport(newTransactions);
      setIsProcessing(false);
      toast({
        title: "Importação concluída",
        description: `${newTransactions.length} transações foram importadas com sucesso.`
      });
      // Reset input
      e.target.value = '';
    };

    reader.readAsText(file);
  };

  return (
    <div className="flex items-center gap-4">
      <div className="relative cursor-pointer">
        <Input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          disabled={isProcessing}
        />
        <Button variant="outline" className="flex items-center gap-2" disabled={isProcessing}>
          {isProcessing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {isProcessing ? "Processando..." : "Importar CSV"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground hidden sm:block">
        Format: Data, Descrição, Valor
      </p>
    </div>
  );
}
