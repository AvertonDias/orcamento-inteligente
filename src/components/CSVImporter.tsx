
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, Loader2 } from 'lucide-react';
import { Transaction, TransactionType } from '@/app/lib/types';
import { suggestTransactionCategory } from '@/ai/flows/sugestao-categoria-transacao';
import { useToast } from '@/hooks/use-toast';

interface CSVImporterProps {
  onImport: (transactions: Transaction[]) => void;
}

export function CSVImporter({ onImport }: CSVImporterProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  // Função auxiliar para parsear linha de CSV lidando com aspas e vírgulas internas
  const parseCSVLine = (line: string) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();

    reader.onload = async (event) => {
      const content = event.target?.result as string;
      const lines = content.split('\n');
      const newTransactions: Transaction[] = [];

      // A primeira linha é o cabeçalho: Data,"Lançamento","Detalhes","Nº documento","Valor","Tipo Lançamento"
      const startIndex = 1;

      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const parts = parseCSVLine(line);
        if (parts.length < 5) continue;

        const date = parts[0];
        const lancamento = parts[1];
        const detalhes = parts[2];
        const valorOriginal = parts[4];

        // Ignorar linhas de saldo ou datas zeradas
        if (date === '00/00/0000' || lancamento.toLowerCase().includes('saldo')) {
          continue;
        }

        // Limpar valor: remover pontos de milhar e trocar vírgula por ponto decimal
        const amountStr = valorOriginal
          .replace(/\./g, '')
          .replace(',', '.')
          .replace(/[^\d.-]/g, '');
        
        const amount = parseFloat(amountStr);
        if (isNaN(amount)) continue;

        const type: TransactionType = amount >= 0 ? 'receita' : 'despesa';
        
        // Combinar lançamento e detalhes para uma melhor sugestão da IA
        const fullDescription = detalhes ? `${lancamento} - ${detalhes}` : lancamento;

        // Usar IA para sugerir categoria
        let category = 'Outros';
        try {
          const suggestion = await suggestTransactionCategory({
            description: fullDescription,
          });
          category = suggestion.suggestedCategory;
        } catch (error) {
          // Fallback silencioso para "Outros" em caso de erro na IA
        }

        newTransactions.push({
          id: Math.random().toString(36).substr(2, 9),
          date: date, // Mantém o formato DD/MM/YYYY para exibição
          description: fullDescription,
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
      e.target.value = '';
    };

    reader.readAsText(file, 'UTF-8');
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
          {isProcessing ? "Processando..." : "Importar Extrato"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground hidden sm:block">
        Suporta formato padrão de exportação bancária.
      </p>
    </div>
  );
}
