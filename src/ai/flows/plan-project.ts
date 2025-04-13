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
import {researchTask} from "@/ai/flows/research-task";

const PlanProjectInputSchema = z.object({
  projectIdea: z.string().describe('The high-level project idea.'),
});
export type PlanProjectInput = z.infer<typeof PlanProjectInputSchema>;

const PlanProjectOutputSchema = z.object({
  tasks: z.array(
    z.object({
      description: z.string().describe('The description of the task, including relevant research information.'),
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
      researchInfo: z.string().describe('Relevant information gathered by the researcher.'),
    }),
  },
  output: {
    schema: z.object({
      tasks: z.array(
        z.object({
          description: z.string().describe('The description of the task, including relevant research information.'),
          assignee: z.enum(['Developer', 'Tester', 'Researcher', 'Doc Creator']).describe('The role assigned to the task.'),
        })
      ).describe('The list of actionable development tasks.'),
    }),
  },
  prompt: `You are an experienced project manager. Break down the following project idea into actionable development tasks. Assign each task to one of the following roles: Developer, Tester, Researcher, Doc Creator. Incorporate the research information to provide more context for each task.\n\nProject Idea: {{{projectIdea}}}\n\nResearch Information: {{{researchInfo}}}`,
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
    // Call the research agent to gather relevant information
    const researchResult = await researchTask({ query: `development information related to ${input.projectIdea}` });

    // Pass the project idea and research information to the prompt
    const {output} = await prompt({
      projectIdea: input.projectIdea,
      researchInfo: researchResult.info,
    });
    return output!;
  }
);
