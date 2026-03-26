'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, PlusCircle, Trash2 } from 'lucide-react';
import { generateScheduleAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { ScheduleGeneratorOutput } from '@/ai/flows/schedule-generator-flow';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

const teacherSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido.'),
  availability: z.string().min(1, 'La disponibilidad es requerida.'),
  subjects: z.string().min(1, 'Las materias son requeridas.'),
  groups: z.string().min(1, 'Los grupos son requeridos.'),
});

type TeacherFormValues = z.infer<typeof teacherSchema>;

type Teacher = {
  name: string;
  availability: string;
  subjects: string[];
  groups: string[];
};

export default function ScheduleGeneratorPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [generatedSchedule, setGeneratedSchedule] =
    useState<ScheduleGeneratorOutput['schedule'] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const form = useForm<TeacherFormValues>({
    resolver: zodResolver(teacherSchema),
    defaultValues: {
      name: '',
      availability: '',
      subjects: '',
      groups: '',
    },
  });

  function onAddTeacher(data: TeacherFormValues) {
    setTeachers((prev) => [
      ...prev,
      {
        ...data,
        subjects: data.subjects.split(',').map((s) => s.trim()),
        groups: data.groups.split(',').map((g) => g.trim()),
      },
    ]);
    form.reset();
    toast({ title: 'Docente agregado', description: `${data.name} ha sido añadido a la lista.` });
  }

  function removeTeacher(index: number) {
    const teacherName = teachers[index].name;
    setTeachers((prev) => prev.filter((_, i) => i !== index));
    toast({ title: 'Docente eliminado', description: `${teacherName} ha sido removido de la lista.` });
  }

  async function handleGenerateSchedule() {
    if (teachers.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Debes agregar al menos un docente.',
      });
      return;
    }

    setIsGenerating(true);
    setGeneratedSchedule(null);

    const result = await generateScheduleAction({ teachers });

    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Error al generar horario',
        description: result.error,
      });
    } else if (result.schedule) {
      setGeneratedSchedule(result.schedule);
      toast({
        title: 'Horario Generado',
        description: 'El horario ha sido generado exitosamente.',
      });
    }
    setIsGenerating(false);
  }

  return (
    <div className="container py-10 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Generador de Horarios con IA</CardTitle>
          <CardDescription>
            Agrega los docentes con sus restricciones y la IA generará una
            propuesta de horario.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Form and Teacher List */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">
                    Agregar Docente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit(onAddTeacher)}
                      className="space-y-4"
                    >
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre del Docente</FormLabel>
                            <FormControl>
                              <Input placeholder="Ej. Juan Pérez" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="availability"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Disponibilidad</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Ej. Lunes 7:00-9:00, Miércoles 10:00-12:00"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="subjects"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Materias (separadas por coma)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ej. Matemáticas, Física"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="groups"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Grupos (separados por coma)</FormLabel>
                            <FormControl>
                              <Input placeholder="Ej. 1A, 2B, 3C" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Agregar a la lista
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">
                    Docentes para el Horario ({teachers.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {teachers.length > 0 ? (
                    <ul className="space-y-3">
                      {teachers.map((teacher, index) => (
                        <li
                          key={index}
                          className="flex justify-between items-center p-3 border rounded-md"
                        >
                          <div>
                            <p className="font-semibold">{teacher.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Materias: {teacher.subjects.join(', ')}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeTeacher(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground text-center">
                      Aún no has agregado docentes.
                    </p>
                  )}
                  {teachers.length > 0 && (
                    <Button
                      className="w-full mt-6"
                      onClick={handleGenerateSchedule}
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Generar Horario
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Generated Schedule */}
            <div className="md:col-span-1">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="text-xl">
                    Horario Generado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isGenerating && (
                    <div className="flex flex-col items-center justify-center h-64 gap-4">
                      <Loader2 className="h-12 w-12 animate-spin text-primary" />
                      <p className="text-muted-foreground">
                        Generando horario...
                      </p>
                    </div>
                  )}
                  {!isGenerating && !generatedSchedule && (
                    <div className="flex items-center justify-center h-64 text-center text-muted-foreground">
                      <p>
                        El horario aparecerá aquí una vez que se genere.
                      </p>
                    </div>
                  )}
                  {generatedSchedule && (
                    <Tabs defaultValue="Lunes" className="w-full">
                      <TabsList className="grid w-full grid-cols-5">
                        {Object.keys(generatedSchedule).map((day) => (
                          <TabsTrigger key={day} value={day}>
                            {day}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                      {Object.entries(generatedSchedule).map(([day, slots]) => (
                        <TabsContent key={day} value={day}>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Hora</TableHead>
                                <TableHead>Grupo</TableHead>
                                <TableHead>Materia</TableHead>
                                <TableHead>Docente</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {slots.length > 0 ? (
                                slots.map((slot, index) => (
                                  <TableRow key={index}>
                                    <TableCell>{slot.time}</TableCell>
                                    <TableCell>{slot.group}</TableCell>
                                    <TableCell>{slot.subject}</TableCell>
                                    <TableCell>{slot.teacher}</TableCell>
                                  </TableRow>
                                ))
                              ) : (
                                <TableRow>
                                  <TableCell colSpan={4} className="text-center">
                                    No hay clases programadas para este día.
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </TabsContent>
                      ))}
                    </Tabs>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
