
"use client";

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, CreditCard, Landmark } from 'lucide-react';
import { Transaction, TransactionType, BankType } from '@/app/lib/types';
import { suggestTransactionCategory } from '@/ai/flows/sugestao-categoria-transacao';
import { useToast } from '@/hooks/use-toast';

interface CSVImporterProps {
  onImport: (transactions: Transaction[]) => void;
}

export function CSVImporter({ onImport }: CSVImporterProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeBank, setActiveBank] = useState<BankType | null>(null);
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
    if (!dateStr) return '';
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
      return `${year}-${month}-${day}`;
    }
    return dateStr;
  };

  /**
   * Limpa a descrição removendo padrões de data comuns em extratos (Ex: 06/03/2026)
   */
  const cleanDescription = (desc: string) => {
    return desc
      .replace(/\d{2}\/\d{2}\/\d{4}/g, '') // Remove DD/MM/AAAA
      .replace(/\d{2}\/\d{2}\/\d{2}/g, '')   // Remove DD/MM/AA
      .replace(/\s\s+/g, ' ')               // Remove espaços duplos
      .trim();
  };

  const handleButtonClick = (bank: BankType) => {
    setActiveBank(bank);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeBank) return;

    setIsProcessing(true);
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const lines = content.split('\n');
        const newTransactions: Transaction[] = [];

        // Skip header
        const startIndex = 1;

        for (let i = startIndex; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const parts = parseCSVLine(line);
          
          let rawDate = '';
          let fullDescription = '';
          let valorOriginal = '';

          if (activeBank === 'bb') {
            if (parts.length < 5) continue;
            rawDate = parts[0];
            const lancamento = parts[1];
            const detalhes = parts[2];
            valorOriginal = parts[4];
            
            if (!rawDate || rawDate === '00/00/0000' || lancamento.toLowerCase().includes('saldo')) {
              continue;
            }
            fullDescription = detalhes ? `${lancamento} - ${detalhes}` : lancamento;
          } else if (activeBank === 'nubank') {
            if (parts.length < 4) continue;
            rawDate = parts[0];
            valorOriginal = parts[1];
            fullDescription = parts[3];

            if (!rawDate || !valorOriginal) continue;
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
          
          // Limpeza da descrição removendo datas e espaços extras
          const cleanedDescription = cleanDescription(fullDescription);

          let category = 'Outros';
          try {
            const suggestion = await suggestTransactionCategory({
              description: cleanedDescription,
            });
            category = suggestion.suggestedCategory;
          } catch (error) {
            // Mantém categoria padrão em caso de erro na IA
          }

          newTransactions.push({
            id: Math.random().toString(36).substring(2, 11),
            date: isoDate,
            description: cleanedDescription,
            amount: Math.abs(amount),
            category,
            type,
            bank: activeBank
          });
        }

        newTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        if (newTransactions.length > 0) {
          onImport(newTransactions);
          toast({
            title: "Importação concluída",
            description: `${newTransactions.length} transações do ${activeBank === 'bb' ? 'Banco do Brasil' : 'Nubank'} processadas.`
          });
        } else {
          toast({
            variant: "destructive",
            title: "Arquivo inválido",
            description: `Não encontramos transações válidas no formato do ${activeBank === 'bb' ? 'BB' : 'Nubank'}.`
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
        setActiveBank(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    const encoding = activeBank === 'bb' ? 'ISO-8859-1' : 'UTF-8';
    reader.readAsText(file, encoding);
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="file"
        accept=".csv"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
      
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => handleButtonClick('bb')}
        disabled={isProcessing}
        className="relative overflow-hidden gap-2 min-w-[140px]"
      >
        {isProcessing && activeBank === 'bb' ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Landmark className="h-4 w-4 text-primary" />
        )}
        <span>Extrato BB</span>
      </Button>

      <Button 
        variant="outline" 
        size="sm"
        onClick={() => handleButtonClick('nubank')}
        disabled={isProcessing}
        className="relative overflow-hidden gap-2 min-w-[140px]"
      >
        {isProcessing && activeBank === 'nubank' ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <CreditCard className="h-4 w-4 text-accent" />
        )}
        <span>Extrato Nubank</span>
      </Button>
    </div>
  );
}
