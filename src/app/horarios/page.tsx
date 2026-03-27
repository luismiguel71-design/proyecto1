
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toPng } from 'html-to-image';
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
import { Loader2, PlusCircle, Trash2, Download } from 'lucide-react';
import { generateScheduleAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { ScheduleGeneratorOutput } from '@/ai/flows/schedule-generator-flow';
import { careers } from '../lib/school-data';
import { Label } from '@/components/ui/label';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const scheduleFormSchema = z.object({
  subjects: z.array(z.object({
    name: z.string().min(1, 'Materia es requerida.'),
    hours: z.coerce.number().min(1, 'Horas debe ser al menos 1.'),
    teacher: z.string().min(1, 'Docente es requerido.'),
    group: z.string().min(1),
  })),
  teachers: z.array(z.object({
    name: z.string().min(1, 'Nombre es requerido.'),
    availability: z.string().min(1, 'Disponibilidad es requerida.'),
  })),
});

type ScheduleFormValues = z.infer<typeof scheduleFormSchema>;

const semesters = ["1", "2", "3", "4", "5", "6"];
const LOCAL_STORAGE_KEY = 'cbtis_schedule_data';
const timeSlots = ["07:00-08:00", "08:00-09:00", "09:00-10:00", "10:00-11:00", "11:00-12:00", "12:00-13:00", "13:00-14:00", "14:00-15:00"];
const days = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

export default function HorariosPage() {
  const [generatedSchedule, setGeneratedSchedule] = useState<ScheduleGeneratorOutput['schedule'] | null>(null);
  const [activeScheduleGroup, setActiveScheduleGroup] = useState<string | null>(null);
  const [generatingGroup, setGeneratingGroup] = useState<string | null>(null);
  const { toast } = useToast();
  const scheduleRef = useRef<HTMLDivElement>(null);
  
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

  // Load data from localStorage on component mount
  useEffect(() => {
    try {
      const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        // You might want to validate parsedData with Zod here in a real app
        form.reset(parsedData);
      }
    } catch (error) {
      console.error("Failed to load schedule data from localStorage", error);
      localStorage.removeItem(LOCAL_STORAGE_KEY); // Clear corrupted data
    }
  }, [form]);

  // Save data to localStorage on any change
  useEffect(() => {
    const subscription = form.watch((value) => {
      try {
        const dataToStore = JSON.stringify(value);
        localStorage.setItem(LOCAL_STORAGE_KEY, dataToStore);
      } catch (error) {
        console.error("Failed to save schedule data to localStorage", error);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);
  
  const { fields: subjectFields, append: appendSubject, remove: removeSubject } = useFieldArray({ control: form.control, name: "subjects" });
  const { fields: teacherFields, append: appendTeacher, remove: removeTeacher } = useFieldArray({ control: form.control, name: "teachers" });

  const handleGenerateForGroup = async (group: string) => {
    setGeneratingGroup(group);
    setGeneratedSchedule(null);
    setActiveScheduleGroup(group);

    const allTeachers = form.getValues('teachers');
    const groupSubjects = form.getValues('subjects').filter(s => s.group === group);
    
    if (groupSubjects.length === 0) {
      toast({ variant: 'destructive', title: 'No hay materias', description: `Agrega materias al grupo "${group}" para poder generar un horario.` });
      setGeneratingGroup(null);
      return;
    }
     if (allTeachers.length === 0) {
      toast({ variant: 'destructive', title: 'No hay docentes', description: 'Agrega al menos un docente para poder generar un horario.' });
      setGeneratingGroup(null);
      return;
    }

    const result = await generateScheduleAction({ teachers: allTeachers, subjects: groupSubjects });

    if (result.error) {
      toast({ variant: 'destructive', title: 'Error al generar horario', description: result.error });
    } else if (result.schedule) {
      setGeneratedSchedule(result.schedule);
      toast({ title: 'Horario Generado', description: `El horario para ${group} ha sido generado exitosamente.` });
    }
    setGeneratingGroup(null);
  }

  const handleAddTeacher = () => {
    if (newTeacherName && newTeacherAvailability) {
      if (form.getValues('teachers').some(t => t.name.toLowerCase() === newTeacherName.toLowerCase())) {
        toast({ variant: 'destructive', title: 'Docente duplicado', description: 'Este docente ya ha sido añadido.' });
        return;
      }
      appendTeacher({ name: newTeacherName, availability: newTeacherAvailability });
      setNewTeacherName('');
      setNewTeacherAvailability('');
    } else {
      toast({ variant: 'destructive', title: 'Faltan datos del docente', description: "Por favor, completa el nombre y la disponibilidad." });
    }
  };

  const handleAddSubject = () => {
    if (newSubjectName && newSubjectHours && newSubjectTeacher) {
      const group = `${careers.find(c => c.slug === selectedCareer)?.title || selectedCareer} ${selectedSemester}° Semestre`;
      appendSubject({ name: newSubjectName, hours: parseInt(newSubjectHours), teacher: newSubjectTeacher, group });
      setNewSubjectName('');
      setNewSubjectHours('');
      setNewSubjectTeacher('');
    } else {
      toast({ variant: 'destructive', title: 'Faltan datos de la materia', description: 'Por favor, completa todos los campos de la materia.' });
    }
  };
  
  const handleExport = useCallback(() => {
    if (scheduleRef.current === null) {
      return;
    }
    toPng(scheduleRef.current, { cacheBust: true })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `horario-${activeScheduleGroup?.replace(/\s+/g, '-')}.png`;
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.log(err);
        toast({
          variant: 'destructive',
          title: 'Error al exportar',
          description: 'No se pudo generar la imagen del horario.'
        });
      });
  }, [activeScheduleGroup, toast]);


  const allFormSubjects = form.watch('subjects');
  const groups = Array.from(new Set(allFormSubjects.map(s => s.group))).sort();

  return (
    <div className="container py-10 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Generador de Horarios con IA</CardTitle>
          <CardDescription>Configura las materias, docentes y sus restricciones. La IA creará una propuesta de horario optimizada por grupo.</CardDescription>
        </CardHeader>
      </Card>
      
      <Form {...form}>
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
                <div className="space-y-2 pt-4 max-h-60 overflow-y-auto">
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
              <CardHeader><CardTitle>2. Añadir Materias a un Grupo</CardTitle></CardHeader>
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
              </CardContent>
            </Card>
          </div>
          <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>3. Grupos y Generación de Horario</CardTitle>
                </CardHeader>
                <CardContent>
                    {groups.length > 0 ? (
                        <Accordion type="multiple" className="w-full">
                        {groups.map(group => {
                            const groupSubjects = subjectFields.filter(s => s.group === group);
                            const groupSubjectIndices = subjectFields.map((s, i) => s.group === group ? i : -1).filter(i => i !== -1);
                            
                            return (
                            <AccordionItem value={group} key={group}>
                                <AccordionTrigger>{group} ({groupSubjects.length} materias)</AccordionTrigger>
                                <AccordionContent className="space-y-3">
                                    {groupSubjects.map((subject, index) => (
                                        <div key={subject.id} className="flex items-center justify-between p-2 border rounded-md">
                                            <div><p className="font-semibold">{subject.name} ({subject.hours}h)</p><p className="text-sm text-muted-foreground">{subject.teacher}</p></div>
                                            <Button type="button" variant="ghost" size="icon" onClick={() => removeSubject(groupSubjectIndices[index])}><Trash2 className="h-4 w-4"/></Button>
                                        </div>
                                    ))}
                                    {groupSubjects.length === 0 && <p className="text-sm text-center text-muted-foreground py-4">No hay materias para este grupo.</p>}
                                    <Button type="button" className="w-full mt-4" onClick={() => handleGenerateForGroup(group)} disabled={generatingGroup === group}>
                                        {generatingGroup === group ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Generando...</> : `Generar Horario para este Grupo`}
                                    </Button>
                                </AccordionContent>
                            </AccordionItem>
                            )
                        })}
                        </Accordion>
                    ) : (
                        <p className="text-sm text-center text-muted-foreground py-4">Añade materias para ver los grupos aquí.</p>
                    )}
                </CardContent>
            </Card>

            <Card className="min-h-[400px] sticky top-24">
              <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>
                        Horario Generado
                        {activeScheduleGroup && <span className="block text-base font-normal text-muted-foreground">para {activeScheduleGroup}</span>}
                    </CardTitle>
                    {generatedSchedule && (
                        <Button onClick={handleExport} variant="outline" size="sm">
                            <Download className="mr-2 h-4 w-4" />
                            Exportar como PNG
                        </Button>
                    )}
                </div>
              </CardHeader>
              <CardContent>
                {(generatingGroup) && <div className="flex flex-col items-center justify-center h-full gap-4"><Loader2 className="h-12 w-12 animate-spin text-primary"/><p className="text-muted-foreground">Generando horario para {generatingGroup}...</p></div>}
                {!(generatingGroup) && !generatedSchedule && <div className="flex items-center justify-center h-full text-center text-muted-foreground"><p>El horario de un grupo aparecerá aquí una vez que se genere.</p></div>}
                {generatedSchedule && (
                  <div ref={scheduleRef} className="bg-white p-4 rounded-lg text-black">
                     <h2 className="text-xl font-bold text-center mb-2">Horario de Clases</h2>
                     <h3 className="text-lg font-semibold text-center mb-4">{activeScheduleGroup}</h3>
                    <div className="grid grid-cols-6 border border-gray-300">
                        <div className="font-bold text-center p-2 border-b border-r border-gray-300 bg-gray-100">Hora</div>
                        {days.map(day => (
                            <div key={day} className="font-bold text-center p-2 border-b border-r border-gray-300 bg-gray-100 last:border-r-0">{day}</div>
                        ))}

                        {timeSlots.map(time => (
                            <>
                                <div key={time} className="font-semibold text-center p-2 border-b border-r border-gray-300 bg-gray-50 flex items-center justify-center">{time}</div>
                                {days.map(day => {
                                    const slotData = generatedSchedule[day as keyof typeof generatedSchedule]?.find(s => s.time === time);
                                    return (
                                        <div key={`${day}-${time}`} className="p-2 border-b border-r border-gray-300 last:border-r-0 min-h-[70px] text-xs">
                                           {slotData ? (
                                                <div>
                                                    <p className="font-bold">{slotData.subject}</p>
                                                    <p className="text-gray-600">{slotData.teacher}</p>
                                                </div>
                                           ) : null}
                                        </div>
                                    )
                                })}
                            </>
                        ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </Form>
    </div>
  );
}

    