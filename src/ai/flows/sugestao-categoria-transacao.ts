'use server';
/**
 * @fileOverview Um fluxo Genkit para sugerir categorias para transações financeiras com base em descrições e histórico.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SuggestTransactionCategoryInputSchema = z.object({
  description: z.string().describe('A descrição da transação.'),
  historicalTransactions: z.array(z.object({
    description: z.string(),
    category: z.string(),
  })).optional().describe('Exemplos de transações anteriores.'),
});

export type SuggestTransactionCategoryInput = z.infer<typeof SuggestTransactionCategoryInputSchema>;

const SuggestTransactionCategoryOutputSchema = z.object({
  suggestedCategory: z.string().describe('A categoria sugerida.'),
});

export type SuggestTransactionCategoryOutput = z.infer<typeof SuggestTransactionCategoryOutputSchema>;

export async function suggestTransactionCategory(input: SuggestTransactionCategoryInput): Promise<SuggestTransactionCategoryOutput> {
  return suggestTransactionCategoryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestTransactionCategoryPrompt',
  input: { schema: SuggestTransactionCategoryInputSchema },
  output: { schema: SuggestTransactionCategoryOutputSchema },
  prompt: `Você é um assistente financeiro especializado. Sugira uma categoria única e curta (ex: Alimentação, Transporte, Lazer) para a transação abaixo.

Descrição: "{{{description}}}"

{{#if historicalTransactions}}
Use estas transações anteriores como referência de estilo:
{{#each historicalTransactions}}
- "{{{this.description}}}" -> {{{this.category}}}
{{/each}}
{{/if}}

Retorne a resposta no campo "suggestedCategory".`,
});

const suggestTransactionCategoryFlow = ai.defineFlow(
  {
    name: 'suggestTransactionCategoryFlow',
    inputSchema: SuggestTransactionCategoryInputSchema,
    outputSchema: SuggestTransactionCategoryOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('Não foi possível obter uma sugestão da IA.');
    }
    return output;
  }
);
