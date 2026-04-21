
export type TransactionType = 'receita' | 'despesa';
export type BankType = 'bb' | 'nubank' | 'manual';

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  type: TransactionType;
  bank?: BankType;
  isIgnored?: boolean;
  observations?: string;
}

/**
 * Lista central de categorias. 
 * Para adicionar ou remover categorias globalmente, edite este array.
 */
export const DEFAULT_CATEGORIES = [
  'Alimentação',
  'Transporte',
  'Moradia',
  'Saúde',
  'Educação',
  'Lazer',
  'Vestuário',
  'Serviços',
  'Investimentos',
  'Presentes',
  'Assinaturas',
  'Impostos',
  'Outros'
];
