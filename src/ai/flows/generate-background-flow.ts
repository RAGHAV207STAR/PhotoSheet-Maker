
'use server';
/**
 * @fileOverview An AI flow to generate a new background for an image.
 *
 * - generateBackground - A function that takes a text prompt and generates a new background image.
 * - GenerateBackgroundInput - The input type for the generateBackground function.
 * - GenerateBackgroundOutput - The return type for the generateBackground function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateBackgroundInputSchema = z.object({
  prompt: z.string().describe('A description of the desired new background.'),
});
export type GenerateBackgroundInput = z.infer<typeof GenerateBackgroundInputSchema>;

const GenerateBackgroundOutputSchema = z.object({
  imageDataUri: z.string().optional().describe("The generated background image, as a data URI."),
  error: z.string().optional().describe("An error message if the operation failed."),
});
export type GenerateBackgroundOutput = z.infer<typeof GenerateBackgroundOutputSchema>;

export async function generateBackground(input: GenerateBackgroundInput): Promise<GenerateBackgroundOutput> {
  return generateBackgroundFlow(input);
}

const generateBackgroundFlow = ai.defineFlow(
  {
    name: 'generateBackgroundFlow',
    inputSchema: GenerateBackgroundInputSchema,
    outputSchema: GenerateBackgroundOutputSchema,
  },
  async (input) => {
    try {
      const { media } = await ai.generate({
        model: 'googleai/imagen-4.0-fast-generate-001',
        prompt: `You are an expert photo editor. Generate a realistic background image based on the following prompt: "${input.prompt}"`,
      });

      if (!media || !media.url) {
        return { error: 'Failed to generate image. No media was returned from the AI model.' };
      }
      
      return { imageDataUri: media.url };
    } catch (error: any) {
      console.error("Error in generateBackgroundFlow:", error);
      // Return a structured error to the client
      const errorMessage = error.message && error.message.includes('429')
        ? 'API quota exceeded. Please check your plan and billing details or try again later.'
        : 'An unexpected error occurred while generating the background.';
      return { error: errorMessage };
    }
  }
);

