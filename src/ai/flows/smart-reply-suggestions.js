'use server';

/**
 * @fileOverview A smart reply suggestion AI agent.
 *
 * - getSmartReplySuggestions - A function that generates smart reply suggestions based on chat history.
 * - SmartReplySuggestionsInput - The input type for the getSmartReplySuggestions function.
 * - SmartReplySuggestionsOutput - The return type for the getSmartReplySuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SmartReplySuggestionsInputSchema = z.object({
  chatHistory: z
    .string()
    .describe('The complete chat history to generate smart reply suggestions from.'),
});


const SmartReplySuggestionsOutputSchema = z.object({
  suggestions: z
    .array(z.string())
    .describe('An array of smart reply suggestions based on the chat history.'),
});


export async function getSmartReplySuggestions(
  input
) {
  return smartReplySuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'smartReplySuggestionsPrompt',
  input: {schema: SmartReplySuggestionsInputSchema},
  output: {schema: SmartReplySuggestionsOutputSchema},
  prompt: `You are an AI assistant designed to provide smart reply suggestions for a given chat history.

  Given the following chat history, generate three short and relevant reply suggestions that the user can quickly use.

  Chat History:
  {{chatHistory}}

  Reply Suggestions:
  1.
  2.
  3.`,
});

const smartReplySuggestionsFlow = ai.defineFlow(
  {
    name: 'smartReplySuggestionsFlow',
    inputSchema: SmartReplySuggestionsInputSchema,
    outputSchema: SmartReplySuggestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output;
  }
);
