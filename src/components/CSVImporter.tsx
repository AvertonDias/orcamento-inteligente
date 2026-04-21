"use client";

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, FileCheck } from 'lucide-react';
import { Transaction, TransactionType } from '@/app/lib/types';
import { suggestTransactionCategory } from '@/ai/flows/sugestao-categoria-transacao';
import { useToast } from '@/hooks/use-toast';

interface CSVImporterProps {
  onImport: (transactions: Transaction[]) => void;
}

export function CSVImporter({ onImport }: CSVImporterProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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

  const parseDate = (dateStr: string) => {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
      return `${year}-${month}-${day}`;
    }
    return dateStr;
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const lines = content.split('\n');
        const newTransactions: Transaction[] = [];

        // Banco do Brasil CSV usually starts with headers on line 1 (index 0)
        const startIndex = 1;

        for (let i = startIndex; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const parts = parseCSVLine(line);
          // BB CSV structure: Data, Lançamento, Detalhes, Número documento, Valor
          if (parts.length < 5) continue;

          const rawDate = parts[0];
          const lancamento = parts[1];
          const detalhes = parts[2];
          const valorOriginal = parts[4];

          if (!rawDate || rawDate === '00/00/0000' || lancamento.toLowerCase().includes('saldo')) {
            continue;
          }

          const isoDate = parseDate(rawDate);
          
          const amountStr = valorOriginal
            .replace(/\./g, '')
            .replace(',', '.')
            .replace(/[^\d.-]/g, '');
          
          const amount = parseFloat(amountStr);
          
          if (isNaN(amount) || amount === 0) {
            continue;
          }

          const type: TransactionType = amount >= 0 ? 'receita' : 'despesa';
          const fullDescription = detalhes ? `${lancamento} - ${detalhes}` : lancamento;

          let category = 'Outros';
          try {
            const suggestion = await suggestTransactionCategory({
              description: fullDescription,
            });
            category = suggestion.suggestedCategory;
          } catch (error) {
            // IA offline ou erro, mantém Outros
          }

          newTransactions.push({
            id: Math.random().toString(36).substr(2, 9),
            date: isoDate,
            description: fullDescription,
            amount: Math.abs(amount),
            category,
            type
          });
        }

        newTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        if (newTransactions.length > 0) {
          onImport(newTransactions);
          toast({
            title: "Importação concluída",
            description: `${newTransactions.length} transações do Banco do Brasil foram processadas.`
          });
        } else {
          toast({
            variant: "destructive",
            title: "Arquivo inválido",
            description: "Não encontramos transações válidas no formato Banco do Brasil."
          });
        }
      } catch (err) {
        toast({
          variant: "destructive",
          title: "Erro no processamento",
          description: "Não foi possível ler o arquivo CSV."
        });
      } finally {
        setIsProcessing(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.readAsText(file, 'ISO-8859-1');
  };

  return (
    <div className="flex items-center">
      <input
        type="file"
        accept=".csv"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
      <Button 
        variant="outline" 
        onClick={handleButtonClick}
        disabled={isProcessing}
        className="relative overflow-hidden min-w-[160px] gap-2 transition-all"
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="animate-pulse">Processando BB...</span>
          </>
        ) : (
          <>
            <Upload className="h-4 w-4" />
            <span>Importar Extrato BB</span>
          </>
        )}
        
        {isProcessing && (
          <div className="absolute bottom-0 left-0 h-1 bg-primary/20 animate-progress w-full" />
        )}
      </Button>
    </div>
  );
}
