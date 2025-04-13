'use server';
/**
 * @fileOverview Generates Next.js code based on a given task description.
 *
 * - generateCode - A function that generates code based on a task description.
 * - GenerateCodeInput - The input type for the generateCode function.
 * - GenerateCodeOutput - The return type for the generateCode function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const GenerateCodeInputSchema = z.object({
  taskDescription: z.string().describe('The description of the coding task.'),
});
export type GenerateCodeInput = z.infer<typeof GenerateCodeInputSchema>;

const GenerateCodeOutputSchema = z.object({
  code: z.string().describe('The generated Next.js code.'),
  progress: z.string().describe('A short summary of what code was generated'),
});
export type GenerateCodeOutput = z.infer<typeof GenerateCodeOutputSchema>;

export async function generateCode(input: GenerateCodeInput): Promise<GenerateCodeOutput> {
  return generateCodeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCodePrompt',
  input: {
    schema: z.object({
      taskDescription: z.string().describe('The description of the coding task.'),
    }),
  },
  output: {
    schema: z.object({
      code: z.string().describe('The generated Next.js code.'),
      progress: z.string().describe('A short summary of what code was generated'),
    }),
  },
  prompt: `You are an AI Developer agent specializing in generating Next.js code.

You will generate code based on the task description provided.

Task Description: {{{taskDescription}}}

Ensure the code is well-structured, efficient, and follows Next.js best practices.`,
});

const generateCodeFlow = ai.defineFlow<
  typeof GenerateCodeInputSchema,
  typeof GenerateCodeOutputSchema
>(
  {
    name: 'generateCodeFlow',
    inputSchema: GenerateCodeInputSchema,
    outputSchema: GenerateCodeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return {
      code: output!.code,
      progress: 'Generated Next.js code based on the provided task description.',
    };
  }
);
