'use server';
/**
 * @fileOverview A research AI agent that gathers information from the web.
 *
 * - researchTask - A function that handles the research process.
 * - ResearchTaskInput - The input type for the researchTask function.
 * - ResearchTaskOutput - The return type for the researchTask function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const ResearchTaskInputSchema = z.object({
  query: z.string().describe('The search query for the research task.'),
});
export type ResearchTaskInput = z.infer<typeof ResearchTaskInputSchema>;

const ResearchTaskOutputSchema = z.object({
  info: z.string().describe('The relevant information gathered from the web.'),
});
export type ResearchTaskOutput = z.infer<typeof ResearchTaskOutputSchema>;

export async function researchTask(input: ResearchTaskInput): Promise<ResearchTaskOutput> {
  return researchTaskFlow(input);
}

const researchTaskPrompt = ai.definePrompt({
  name: 'researchTaskPrompt',
  input: {
    schema: z.object({
      query: z.string().describe('The search query for the research task.'),
    }),
  },
  output: {
    schema: z.object({
      info: z.string().describe('The relevant information gathered from the web.'),
    }),
  },
  prompt: `You are a research agent tasked with gathering information from the web. Your goal is to find up-to-date and relevant information based on the search query provided. Provide a concise summary of the information you find.\n\nSearch Query: {{{query}}}`,
});

const researchTaskFlow = ai.defineFlow<
  typeof ResearchTaskInputSchema,
  typeof ResearchTaskOutputSchema
>(
  {
    name: 'researchTaskFlow',
    inputSchema: ResearchTaskInputSchema,
    outputSchema: ResearchTaskOutputSchema,
  },
  async input => {
    const {output} = await researchTaskPrompt(input);
    return output!;
  }
);
