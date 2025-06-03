import {z} from 'genkit';

// Schemas for generate-code.ts
export const GenerateCodeInputSchema = z.object({
  taskDescription: z.string().describe('The description of the coding task.'),
});
export type GenerateCodeInput = z.infer<typeof GenerateCodeInputSchema>;

export const GenerateCodeOutputSchema = z.object({
  code: z.string().describe('The generated Next.js code.'),
  progress: z.string().describe('A short summary of what code was generated'),
});
export type GenerateCodeOutput = z.infer<typeof GenerateCodeOutputSchema>;

// Schemas for plan-project.ts
export const PlanProjectInputSchema = z.object({
  projectIdea: z.string().describe('The high-level project idea.'),
});
export type PlanProjectInput = z.infer<typeof PlanProjectInputSchema>;

export const PlanProjectOutputSchema = z.object({
  tasks: z.array(
    z.object({
      description: z.string().describe('The description of the task, including relevant research information.'),
      assignee: z.enum(['Developer', 'Tester', 'Researcher', 'Doc Creator']).describe('The role assigned to the task.'),
    })
  ).describe('The list of actionable development tasks.'),
});
export type PlanProjectOutput = z.infer<typeof PlanProjectOutputSchema>;

// Schemas for research-task.ts
export const ResearchTaskInputSchema = z.object({
  query: z.string().describe('The search query for the research task.'),
});
export type ResearchTaskInput = z.infer<typeof ResearchTaskInputSchema>;

export const ResearchTaskOutputSchema = z.object({
  info: z.string().describe('The relevant information gathered from the web.'),
});
export type ResearchTaskOutput = z.infer<typeof ResearchTaskOutputSchema>;

// Schemas for test-code.ts
export const TestCodeInputSchema = z.object({
  code: z.string().describe('The code to be tested.'),
  componentName: z.string().describe('The name of the component to be tested.'),
});
export type TestCodeInput = z.infer<typeof TestCodeInputSchema>;

export const TestCodeOutputSchema = z.object({
  tests: z.string().describe('The generated tests for the component.'),
  results: z.string().describe('The results of running the tests.'),
});
export type TestCodeOutput = z.infer<typeof TestCodeOutputSchema>;
