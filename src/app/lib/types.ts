
export type TransactionType = 'receita' | 'despesa';

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  type: TransactionType;
  isIgnored?: boolean;
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
