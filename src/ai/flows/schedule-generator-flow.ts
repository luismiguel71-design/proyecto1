'use server';
/**
 * @fileOverview A Genkit flow for generating a school schedule based on teacher constraints.
 *
 * - generateSchedule - A function that handles the schedule generation process.
 * - ScheduleGeneratorInput - The input type for the generateSchedule function.
 * - ScheduleGeneratorOutput - The return type for the generateSchedule function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const TeacherSchema = z.object({
  name: z.string().describe('The name of the teacher.'),
  availability: z.string().describe('A string describing the teacher\'s available time slots. E.g., "Lunes 9:00-11:00, Miércoles 10:00-13:00".'),
  subjects: z.array(z.string()).describe('A list of subjects the teacher can impart.'),
  groups: z.array(z.string()).describe('A list of groups the teacher can attend to.'),
});

const ScheduleGeneratorInputSchema = z.object({
  teachers: z.array(TeacherSchema).describe('A list of teachers with their constraints.'),
});
export type ScheduleGeneratorInput = z.infer<typeof ScheduleGeneratorInputSchema>;

const TimeSlotSchema = z.object({
  time: z.string().describe('The time slot for the class, e.g., "07:00-08:00".'),
  group: z.string().describe('The group taking the class.'),
  subject: z.string().describe('The subject being taught.'),
  teacher: z.string().describe('The teacher for the class.'),
});

const ScheduleGeneratorOutputSchema = z.object({
  schedule: z.object({
    Lunes: z.array(TimeSlotSchema),
    Martes: z.array(TimeSlotSchema),
    Miércoles: z.array(TimeSlotSchema),
    Jueves: z.array(TimeSlotSchema),
    Viernes: z.array(TimeSlotSchema),
  }).describe('The generated weekly schedule, organized by day.'),
});
export type ScheduleGeneratorOutput = z.infer<typeof ScheduleGeneratorOutputSchema>;

export async function generateSchedule(input: ScheduleGeneratorInput): Promise<ScheduleGeneratorOutput> {
  return scheduleGeneratorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'scheduleGeneratorPrompt',
  input: { schema: ScheduleGeneratorInputSchema },
  output: { schema: ScheduleGeneratorOutputSchema },
  prompt: `Eres un experto planificador de horarios escolares. Tu tarea es generar un horario de clases para la semana (Lunes a Viernes) basado en la lista de docentes y sus restricciones.

**Reglas y Restricciones:**
1.  El horario de clases es de 7:00 AM a 3:00 PM (15:00).
2.  Las clases deben ser en bloques de 1 hora (e.g., 07:00-08:00, 08:00-09:00, ..., 14:00-15:00).
3.  Un docente no puede enseñar a dos grupos diferentes al mismo tiempo.
4.  Un grupo no puede tener dos clases diferentes al mismo tiempo.
5.  Debes respetar la disponibilidad horaria de cada docente.
6.  Asigna a los docentes únicamente las materias que pueden impartir y los grupos que pueden atender.
7.  Intenta distribuir la carga de trabajo de los docentes de manera equitativa.
8.  Asegúrate de que la salida sea un JSON válido que se ajuste al esquema de salida. No incluyas texto adicional ni explicaciones fuera del JSON.

**Información de los Docentes:**
{{#each teachers}}
-   **Nombre:** {{name}}
-   **Disponibilidad:** {{availability}}
-   **Materias:** {{#each subjects}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
-   **Grupos:** {{#each groups}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
{{/each}}

Genera el horario en el formato JSON especificado.
`,
});

const scheduleGeneratorFlow = ai.defineFlow(
  {
    name: 'scheduleGeneratorFlow',
    inputSchema: ScheduleGeneratorInputSchema,
    outputSchema: ScheduleGeneratorOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('El modelo no pudo generar un horario.');
    }
    // Sort the schedule for each day by time
    for (const day in output.schedule) {
        output.schedule[day as keyof typeof output.schedule].sort((a, b) => a.time.localeCompare(b.time));
    }
    return output;
  }
);
