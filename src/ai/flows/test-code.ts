'use server';
/**
 * @fileOverview Creates and runs basic tests for generated components.
 *
 * - testCode - A function that handles the test creation and execution process.
 * - TestCodeInput - The input type for the testCode function.
 * - TestCodeOutput - The return type for the testCode function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const TestCodeInputSchema = z.object({
  code: z.string().describe('The code to be tested.'),
  componentName: z.string().describe('The name of the component to be tested.'),
});
export type TestCodeInput = z.infer<typeof TestCodeInputSchema>;

const TestCodeOutputSchema = z.object({
  tests: z.string().describe('The generated tests for the component.'),
  results: z.string().describe('The results of running the tests.'),
});
export type TestCodeOutput = z.infer<typeof TestCodeOutputSchema>;

export async function testCode(input: TestCodeInput): Promise<TestCodeOutput> {
  return testCodeFlow(input);
}

const testCodePrompt = ai.definePrompt({
  name: 'testCodePrompt',
  input: {
    schema: z.object({
      code: z.string().describe('The code to be tested.'),
      componentName: z.string().describe('The name of the component to be tested.'),
    }),
  },
  output: {
    schema: z.object({
      tests: z.string().describe('The generated tests for the component.'),
      results: z.string().describe('The results of running the tests.'),
    }),
  },
  prompt: `You are an AI Tester agent responsible for creating and running tests for React components.

  Given the following component code:
  \`\`\`jsx
  {{{code}}}
  \`\`\`

  And the component name: {{{componentName}}}

  1.  Create a comprehensive set of tests using Jest and React Testing Library to ensure the component functions correctly. Consider various scenarios, including rendering, user interactions, and edge cases.
  2.  Write the tests to standard output in a dedicated "tests" field using standard Typescript syntax.
  3.  Execute the tests and capture the results, writing the results to standard output in a dedicated "results" field.
  `,
});

const testCodeFlow = ai.defineFlow<
  typeof TestCodeInputSchema,
  typeof TestCodeOutputSchema
>(
  {
    name: 'testCodeFlow',
    inputSchema: TestCodeInputSchema,
    outputSchema: TestCodeOutputSchema,
  },
  async input => {
    const {output} = await testCodePrompt(input);
    return output!;
  }
);
