
'use server';

import { educativeChatbot } from '@/ai/flows/educative-chatbot-flow';
import { z } from 'zod';

const EducativeChatbotInputSchema = z.object({
  query: z.string().min(1, 'La consulta no puede estar vacía.'),
});

export async function getChatbotResponse(query: string) {
  try {
    const validatedInput = EducativeChatbotInputSchema.safeParse({ query });

    if (!validatedInput.success) {
      return { error: 'La entrada no es válida.' };
    }

    const result = await educativeChatbot({ query: validatedInput.data.query });
    return { response: result.response };
  } catch (error) {
    console.error('Error getting chatbot response:', error);
    return { error: 'Lo siento, no puedo responder en este momento. Por favor, intenta de nuevo más tarde.' };
  }
}
