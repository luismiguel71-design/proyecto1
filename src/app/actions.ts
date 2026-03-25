
'use server';

import { educativeChatbot } from '@/ai/flows/educative-chatbot-flow';
import { z } from 'zod';
import { addEvent, deleteEvent, updateEvent } from '@/lib/firebase/firestore';
import { revalidatePath } from 'next/cache';

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

const eventFormSchema = z.object({
  title: z.string().min(5, 'El título debe tener al menos 5 caracteres.'),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres.'),
  imageUrl: z.string().url('Por favor, introduce una URL de imagen válida.'),
});

export async function addEventAction(values: z.infer<typeof eventFormSchema>) {
    const validatedFields = eventFormSchema.safeParse(values);

    if (!validatedFields.success) {
        return {
            error: "Datos inválidos.",
        };
    }

    try {
        await addEvent(validatedFields.data);
        revalidatePath('/admin/eventos');
        revalidatePath('/noticias');
        revalidatePath('/');
        return { success: "Evento creado exitosamente." };
    } catch (error) {
        return { error: "No se pudo crear el evento." };
    }
}

const updateEventFormSchema = eventFormSchema.extend({
    id: z.string().min(1, "El ID del evento es requerido."),
});

export async function updateEventAction(values: z.infer<typeof updateEventFormSchema>) {
    const validatedFields = updateEventFormSchema.safeParse(values);

    if (!validatedFields.success) {
        return {
            error: "Datos inválidos.",
        };
    }

    const { id, ...eventData } = validatedFields.data;

    try {
        await updateEvent(id, eventData);
        revalidatePath('/admin/eventos');
        revalidatePath(`/noticias/${id}`);
        revalidatePath('/noticias');
        revalidatePath('/');
        return { success: "Evento actualizado exitosamente." };
    } catch (error) {
        return { error: "No se pudo actualizar el evento." };
    }
}

const deleteEventSchema = z.object({
    id: z.string().min(1, "El ID del evento es requerido."),
});

export async function deleteEventAction(id: string) {
    const validatedFields = deleteEventSchema.safeParse({ id });

    if (!validatedFields.success) {
        return {
            error: "ID de evento inválido.",
        };
    }

    try {
        await deleteEvent(validatedFields.data.id);
        revalidatePath('/admin/eventos');
        revalidatePath('/noticias');
        revalidatePath('/');
        return { success: "Evento eliminado exitosamente." };
    } catch (error) {
        return { error: "No se pudo eliminar el evento." };
    }
}
