'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { careers } from '../lib/school-data';
import { Label } from '@/components/ui/label';

const scheduleFormSchema = z.object({
  subjects: z.array(z.object({
    name: z.string().min(1, 'Materia es requerida.'),
    hours: z.coerce.number().min(1, 'Horas debe ser al menos 1.'),
    teacher: z.string().min(1, 'Docente es requerido.'),
    group: z.string().min(1),
  })).min(1, 'Debes agregar al menos una materia.'),
  teachers: z.array(z.object({
    name: z.string().min(1, 'Nombre es requerido.'),
    availability: z.string().min(1, 'Disponibilidad es requerida.'),
  })).min(1, 'Debes agregar al menos un docente.'),
});

type ScheduleFormValues = z.infer<typeof scheduleFormSchema>;

const semesters = ["1", "2", "3", "4", "5", "6"];

export default function HorariosPage() {
  const [generatedSchedule, setGeneratedSchedule] = useState<ScheduleGeneratorOutput['schedule'] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  
  const [selectedCareer, setSelectedCareer] = useState(careers[0].slug);
  const [selectedSemester, setSelectedSemester] = useState(semesters[0]);

  // States for uncontrolled inputs
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newTeacherAvailability, setNewTeacherAvailability] = useState('');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectHours, setNewSubjectHours] = useState('');
  const [newSubjectTeacher, setNewSubjectTeacher] = useState('');

  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      subjects: [],
      teachers: [],
    },
  });
  
  const { fields: subjectFields, append: appendSubject, remove: removeSubject } = useFieldArray({ control: form.control, name: "subjects" });
  const { fields: teacherFields, append: appendTeacher, remove: removeTeacher } = useFieldArray({ control: form.control, name: "teachers" });

  async function handleGenerateSchedule(data: ScheduleFormValues) {
    setIsGenerating(true);
    setGeneratedSchedule(null);
    const result = await generateScheduleAction(data);

    if (result.error) {
      toast({ variant: 'destructive', title: 'Error al generar horario', description: result.error });
    } else if (result.schedule) {
      setGeneratedSchedule(result.schedule);
      toast({ title: 'Horario Generado', description: 'El horario ha sido generado exitosamente.' });
    }
    setIsGenerating(false);
  }

  const handleAddTeacher = () => {
    if (newTeacherName && newTeacherAvailability) {
      if (form.getValues('teachers').some(t => t.name === newTeacherName)) {
        toast({ variant: 'destructive', title: 'Docente duplicado', description: 'Este docente ya ha sido añadido.' });
        return;
      }
      appendTeacher({ name: newTeacherName, availability: newTeacherAvailability });
      setNewTeacherName('');
      setNewTeacherAvailability('');
    } else {
      toast({ variant: 'destructive', title: 'Faltan datos del docente' });
    }
  };

  const handleAddSubject = () => {
    if (newSubjectName && newSubjectHours && newSubjectTeacher) {
      const group = `${careers.find(c => c.slug === selectedCareer)?.title || selectedCareer} ${selectedSemester}°`;
      appendSubject({ name: newSubjectName, hours: parseInt(newSubjectHours), teacher: newSubjectTeacher, group });
      setNewSubjectName('');
      setNewSubjectHours('');
      setNewSubjectTeacher('');
    } else {
      toast({ variant: 'destructive', title: 'Faltan datos de la materia' });
    }
  };

  const currentGroup = `${careers.find(c => c.slug === selectedCareer)?.title || selectedCareer} ${selectedSemester}°`;
  const filteredSubjects = subjectFields.filter(s => s.group === currentGroup);
  const filteredSubjectIndices = subjectFields.map((s, i) => s.group === currentGroup ? i : -1).filter(i => i !== -1);

  return (
    <div className="container py-10 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Generador de Horarios con IA</CardTitle>
          <CardDescription>Configura las materias, docentes y sus restricciones. La IA creará una propuesta de horario optimizada.</CardDescription>
        </CardHeader>
      </Card>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleGenerateSchedule)} className="space-y-8">
          <div className="grid lg:grid-cols-2 gap-8 items-start">
            <div className="space-y-8">
              <Card>
                <CardHeader><CardTitle>1. Gestionar Docentes</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input placeholder="Nombre del docente" value={newTeacherName} onChange={e => setNewTeacherName(e.target.value)} />
                    <Input placeholder="Ej: Lunes 7-11, Mié 10-13" value={newTeacherAvailability} onChange={e => setNewTeacherAvailability(e.target.value)} />
                  </div>
                  <Button type="button" onClick={handleAddTeacher} className="w-full sm:w-auto"><PlusCircle className="mr-2 h-4 w-4"/> Añadir Docente</Button>
                  <div className="space-y-2 pt-4">
                    {teacherFields.map((field, index) => (
                      <div key={field.id} className="flex items-center justify-between p-2 border rounded-md">
                        <div><p className="font-semibold">{field.name}</p><p className="text-sm text-muted-foreground">{field.availability}</p></div>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeTeacher(index)}><Trash2 className="h-4 w-4"/></Button>
                      </div>
                    ))}
                    {teacherFields.length === 0 && <p className="text-sm text-center text-muted-foreground py-4">Agrega al menos un docente.</p>}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>2. Asignar Materias</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4 items-end">
                    <div className="flex-1"><Label>Carrera</Label><Select value={selectedCareer} onValueChange={setSelectedCareer}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{careers.map(c => <SelectItem key={c.slug} value={c.slug}>{c.title}</SelectItem>)}</SelectContent></Select></div>
                    <div className="flex-1"><Label>Semestre</Label><Select value={selectedSemester} onValueChange={setSelectedSemester}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{semesters.map(s => <SelectItem key={s} value={s}>{s}° Semestre</SelectItem>)}</SelectContent></Select></div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Input placeholder="Nombre de materia" value={newSubjectName} onChange={e => setNewSubjectName(e.target.value)} />
                    <Input type="number" placeholder="Horas/semana" value={newSubjectHours} onChange={e => setNewSubjectHours(e.target.value)} />
                    <Select value={newSubjectTeacher} onValueChange={setNewSubjectTeacher}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar Docente"/></SelectTrigger>
                      <SelectContent>{form.watch('teachers').map(t => <SelectItem key={t.name} value={t.name}>{t.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <Button type="button" onClick={handleAddSubject} className="w-full sm:w-auto"><PlusCircle className="mr-2 h-4 w-4"/> Añadir Materia</Button>
                  <p className="font-semibold text-sm pt-4">Materias para {currentGroup}</p>
                  <div className="space-y-2">
                    {filteredSubjects.map((field, index) => (
                      <div key={field.id} className="flex items-center justify-between p-2 border rounded-md">
                        <div><p className="font-semibold">{field.name} ({field.hours}h)</p><p className="text-sm text-muted-foreground">{field.teacher}</p></div>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeSubject(filteredSubjectIndices[index])}><Trash2 className="h-4 w-4"/></Button>
                      </div>
                    ))}
                    {filteredSubjects.length === 0 && <p className="text-sm text-center text-muted-foreground py-4">No hay materias para este grupo.</p>}
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="space-y-8">
              <Card>
                <CardHeader><CardTitle>3. Generar Horario</CardTitle></CardHeader>
                <CardContent>
                  <Button type="submit" className="w-full" disabled={isGenerating}>{isGenerating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Generando...</> : 'Generar Horario con IA'}</Button>
                  <FormMessage className="mt-2 text-center">{form.formState.errors.subjects?.message || form.formState.errors.teachers?.message}</FormMessage>
                </CardContent>
              </Card>

              <Card className="h-full min-h-[400px]">
                <CardHeader><CardTitle>Horario Generado</CardTitle></CardHeader>
                <CardContent>
                  {isGenerating && <div className="flex flex-col items-center justify-center h-full gap-4"><Loader2 className="h-12 w-12 animate-spin text-primary"/><p className="text-muted-foreground">Generando, puede tardar un momento...</p></div>}
                  {!isGenerating && !generatedSchedule && <div className="flex items-center justify-center h-full text-center text-muted-foreground"><p>El horario aparecerá aquí una vez que se genere.</p></div>}
                  {generatedSchedule && (
                    <Tabs defaultValue="Lunes" className="w-full">
                      <TabsList className="grid w-full grid-cols-5">{Object.keys(generatedSchedule).map((day) => (<TabsTrigger key={day} value={day}>{day}</TabsTrigger>))}</TabsList>
                      {Object.entries(generatedSchedule).map(([day, slots]) => (
                        <TabsContent key={day} value={day}>
                          <Table><TableHeader><TableRow><TableHead>Hora</TableHead><TableHead>Grupo</TableHead><TableHead>Materia</TableHead><TableHead>Docente</TableHead></TableRow></TableHeader>
                            <TableBody>
                              {slots.length > 0 ? (slots.map((slot, index) => (<TableRow key={index}><TableCell>{slot.time}</TableCell><TableCell>{slot.group}</TableCell><TableCell>{slot.subject}</TableCell><TableCell>{slot.teacher}</TableCell></TableRow>))) : (<TableRow><TableCell colSpan={4} className="text-center">No hay clases programadas.</TableCell></TableRow>)}
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
        </form>
      </Form>
    </div>
  );
}
