'use server';
/**
 * @fileOverview A project planning AI agent.
 *
 * - planProject - A function that handles the project planning process.
 * - PlanProjectInput - The input type for the planProject function.
 * - PlanProjectOutput - The return type for the planProject function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const PlanProjectInputSchema = z.object({
  projectIdea: z.string().describe('The high-level project idea.'),
});
export type PlanProjectInput = z.infer<typeof PlanProjectInputSchema>;

const PlanProjectOutputSchema = z.object({
  tasks: z.array(
    z.object({
      description: z.string().describe('The description of the task.'),
      assignee: z.enum(['Developer', 'Tester', 'Researcher', 'Doc Creator']).describe('The role assigned to the task.'),
    })
  ).describe('The list of actionable development tasks.'),
});
export type PlanProjectOutput = z.infer<typeof PlanProjectOutputSchema>;

export async function planProject(input: PlanProjectInput): Promise<PlanProjectOutput> {
  return planProjectFlow(input);
}

const prompt = ai.definePrompt({
  name: 'planProjectPrompt',
  input: {
    schema: z.object({
      projectIdea: z.string().describe('The high-level project idea.'),
    }),
  },
  output: {
    schema: z.object({
      tasks: z.array(
        z.object({
          description: z.string().describe('The description of the task.'),
          assignee: z.enum(['Developer', 'Tester', 'Researcher', 'Doc Creator']).describe('The role assigned to the task.'),
        })
      ).describe('The list of actionable development tasks.'),
    }),
  },
  prompt: `You are an experienced project manager. Break down the following project idea into actionable development tasks. Assign each task to one of the following roles: Developer, Tester, Researcher, Doc Creator.\n\nProject Idea: {{{projectIdea}}}`,
});

const planProjectFlow = ai.defineFlow<
  typeof PlanProjectInputSchema,
  typeof PlanProjectOutputSchema
>(
  {
    name: 'planProjectFlow',
    inputSchema: PlanProjectInputSchema,
    outputSchema: PlanProjectOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
