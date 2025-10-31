
'use server';
/**
 * @fileOverview An AI flow to remove the background from an image.
 *
 * - removeBackground - A function that takes an image and returns an image with the background removed.
 * - RemoveBackgroundInput - The input type for the removeBackground function.
 * - RemoveBackgroundOutput - The return type for the removeBackground function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const RemoveBackgroundInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a person or object, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type RemoveBackgroundInput = z.infer<typeof RemoveBackgroundInputSchema>;

const RemoveBackgroundOutputSchema = z.object({
  imageDataUri: z.string().optional().describe("The generated image with the background removed, as a data URI."),
  error: z.string().optional().describe("An error message if the operation failed."),
});
export type RemoveBackgroundOutput = z.infer<typeof RemoveBackgroundOutputSchema>;

export async function removeBackground(input: RemoveBackgroundInput): Promise<RemoveBackgroundOutput> {
  return removeBackgroundFlow(input);
}

const removeBackgroundFlow = ai.defineFlow(
  {
    name: 'removeBackgroundFlow',
    inputSchema: RemoveBackgroundInputSchema,
    outputSchema: RemoveBackgroundOutputSchema,
  },
  async (input) => {
    try {
      const { media } = await ai.generate({
        model: 'googleai/gemini-2.5-flash-image-preview',
        prompt: [
          { media: { url: input.photoDataUri } },
          { text: 'Segment the main subject from the background and output an image with a transparent background.' },
        ],
        config: {
            responseModalities: ['IMAGE'],
        },
      });
    
      if (!media || !media.url) {
        return { error: 'Failed to remove background. The AI did not return an image.' };
      }
      
      return { imageDataUri: media.url };
    } catch (error: any) {
      console.error("Error in removeBackgroundFlow:", error);
      // Return a structured error to the client
      const errorMessage = error.message && (error.message.includes('429') || error.message.toLowerCase().includes('quota'))
        ? 'API quota exceeded. Please check your plan and billing details or try again later.'
        : 'An unexpected error occurred while removing the background.';
      return { error: errorMessage };
    }
  }
);
