
'use server';

import { educativeChatbot } from '@/ai/flows/educative-chatbot-flow';
import { z } from 'zod';
import { addEvent, deleteEvent, updateEvent } from '@/lib/firebase/firestore';
import { revalidatePath } from 'next/cache';
import { generateSchedule, type ScheduleGeneratorInput } from '@/ai/flows/schedule-generator-flow';

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

const SubjectActionSchema = z.object({
    name: z.string().min(1, 'Materia es requerida.'),
    hours: z.coerce.number().min(1, 'Horas debe ser al menos 1.'),
    teacher: z.string().min(1, 'Docente es requerido.'),
    group: z.string().min(1),
});

const TeacherActionSchema = z.object({
  name: z.string().min(1, 'El nombre del docente es requerido.'),
  availability: z.string().min(1, 'La disponibilidad del docente es requerida.'),
});

const ScheduleGeneratorInputSchema = z.object({
  subjects: z.array(SubjectActionSchema).min(1, 'Se requiere al menos una materia para generar el horario.'),
  teachers: z.array(TeacherActionSchema).min(1, 'Se requiere al menos un docente para generar el horario.'),
});


export async function generateScheduleAction(input: ScheduleGeneratorInput) {
  try {
    const validatedInput = ScheduleGeneratorInputSchema.safeParse(input);

    if (!validatedInput.success) {
      console.error(validatedInput.error);
      const firstError = validatedInput.error.errors[0]?.message || 'Los datos de entrada no son válidos.';
      return { error: firstError };
    }

    const result = await generateSchedule(validatedInput.data);
    return { schedule: result.schedule };
  } catch (error) {
    console.error('Error generating schedule:', error);
    const errorMessage = error instanceof Error
      ? error.message
      : 'Lo siento, no se pudo generar el horario. Revisa los datos e intenta de nuevo.';
    return { error: errorMessage };
  }
}
