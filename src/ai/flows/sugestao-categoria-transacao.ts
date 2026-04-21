'use server';
/**
 * @fileOverview Um fluxo Genkit para sugerir categorias para transações financeiras com base em descrições e histórico.
 *
 * - suggestTransactionCategory - Uma função que inicia o processo de sugestão de categoria.
 * - SuggestTransactionCategoryInput - O tipo de entrada para a função suggestTransactionCategory.
 * - SuggestTransactionCategoryOutput - O tipo de retorno para a função suggestTransactionCategory.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SuggestTransactionCategoryInputSchema = z.object({
  description: z
    .string()
    .describe('A descrição da transação para a qual a categoria deve ser sugerida.'),
  historicalTransactions: z
    .array(
      z.object({
        description: z.string().describe('A descrição de uma transação anterior.'),
        category: z.string().describe('A categoria atribuída a uma transação anterior.'),
      })
    )
    .optional()
    .describe('Uma lista de transações previamente categorizadas que podem ser usadas como exemplos para a IA.'),
});

export type SuggestTransactionCategoryInput = z.infer<typeof SuggestTransactionCategoryInputSchema>;

const SuggestTransactionCategoryOutputSchema = z.object({
  suggestedCategory: z.string().describe('A categoria sugerida para a transação.'),
});

export type SuggestTransactionCategoryOutput = z.infer<typeof SuggestTransactionCategoryOutputSchema>;

export async function suggestTransactionCategory(
  input: SuggestTransactionCategoryInput
): Promise<SuggestTransactionCategoryOutput> {
  return suggestTransactionCategoryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestTransactionCategoryPrompt',
  input: { schema: SuggestTransactionCategoryInputSchema },
  output: { schema: SuggestTransactionCategoryOutputSchema },
  prompt: `Você é um assistente financeiro especializado em categorizar transações. Sua tarefa é sugerir uma categoria adequada para uma nova transação com base em sua descrição e, se disponível, em exemplos de transações anteriores.\n\nAqui estão algumas transações categorizadas anteriormente que você pode usar como referência:\n{{#if historicalTransactions}}\n{{#each historicalTransactions}}\n- Descrição: "{{{this.description}}}" -> Categoria: "{{{this.category}}}"\n{{/each}}\n{{else}}\nNão há transações históricas fornecidas.\n{{/if}}\n\nNova transação para categorizar:\nDescrição: "{{{description}}}"\n\nPor favor, retorne a categoria sugerida em formato JSON, com a chave "suggestedCategory". Por exemplo: {"suggestedCategory": "Alimentação"}`,
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
      throw new Error('Failed to get a category suggestion from the AI.');
    }
    return output;
  }
);
