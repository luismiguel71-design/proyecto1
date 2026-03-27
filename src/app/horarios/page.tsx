
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
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, PlusCircle, Trash2, Download, Pencil } from 'lucide-react';
import { generateScheduleAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { ScheduleGeneratorOutput } from '@/ai/flows/schedule-generator-flow';
import { careers, teachers as defaultTeachersList } from '../lib/school-data';
import { Label } from '@/components/ui/label';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

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

type Teacher = { index: number; name: string; availability: string; };
type Subject = { index: number; name: string; hours: number; teacher: string; group: string };

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
  
  // State for edit dialogs
  const [isTeacherEditDialogOpen, setIsTeacherEditDialogOpen] = useState(false);
  const [isSubjectEditDialogOpen, setIsSubjectEditDialogOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  
  // State for edit dialog inputs
  const [teacherEditName, setTeacherEditName] = useState('');
  const [teacherEditAvailability, setTeacherEditAvailability] = useState('');
  const [subjectEditName, setSubjectEditName] = useState('');
  const [subjectEditHours, setSubjectEditHours] = useState('');
  const [subjectEditTeacher, setSubjectEditTeacher] = useState('');

  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      subjects: [],
      teachers: [],
    },
  });

  // Load data from localStorage on component mount, or load defaults.
  useEffect(() => {
    try {
      const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        const validation = scheduleFormSchema.safeParse(parsedData);
        if (validation.success) {
          form.reset(validation.data);
          return; // Exit if data loaded successfully
        } else {
          console.error("Invalid localStorage data. Loading defaults.", validation.error);
          localStorage.removeItem(LOCAL_STORAGE_KEY);
        }
      }

      // No data in localStorage or data was invalid, so load defaults
      const initialTeachers = defaultTeachersList.map(teacher => ({
        name: teacher.name,
        availability: 'No especificada',
      }));

      form.reset({
        subjects: [],
        teachers: initialTeachers,
      });
      
    } catch (error) {
      console.error("Error loading data. Resetting to defaults.", error);
      localStorage.removeItem(LOCAL_STORAGE_KEY); // Clear corrupted data
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.watch]);
  
  const { fields: subjectFields, append: appendSubject, remove: removeSubject, update: updateSubject } = useFieldArray({ control: form.control, name: "subjects" });
  const { fields: teacherFields, append: appendTeacher, remove: removeTeacher, update: updateTeacher } = useFieldArray({ control: form.control, name: "teachers" });

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
    toPng(scheduleRef.current, { cacheBust: true, backgroundColor: 'white' })
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

  const handleOpenTeacherEditDialog = (index: number) => {
    const teacher = teacherFields[index];
    setEditingTeacher({ index, ...teacher });
    setTeacherEditName(teacher.name);
    setTeacherEditAvailability(teacher.availability);
    setIsTeacherEditDialogOpen(true);
  };
  
  const handleUpdateTeacher = () => {
    if (!editingTeacher || !teacherEditName || !teacherEditAvailability) {
        toast({ variant: 'destructive', title: 'Datos incompletos', description: 'El nombre y la disponibilidad no pueden estar vacíos.' });
        return;
    };
    updateTeacher(editingTeacher.index, { name: teacherEditName, availability: teacherEditAvailability });
    setIsTeacherEditDialogOpen(false);
    setEditingTeacher(null);
    toast({ title: 'Docente Actualizado', description: 'Los datos del docente se han guardado.' });
  };
  
  const handleOpenSubjectEditDialog = (index: number) => {
    const subject = subjectFields[index];
    setEditingSubject({ index, ...subject });
    setSubjectEditName(subject.name);
    setSubjectEditHours(String(subject.hours));
    setSubjectEditTeacher(subject.teacher);
    setIsSubjectEditDialogOpen(true);
  };

  const handleUpdateSubject = () => {
    if (!editingSubject || !subjectEditName || !subjectEditHours || !subjectEditTeacher) {
        toast({ variant: 'destructive', title: 'Datos incompletos', description: 'Todos los campos de la materia son requeridos.' });
        return;
    };
    updateSubject(editingSubject.index, { 
        ...editingSubject, 
        name: subjectEditName, 
        hours: parseInt(subjectEditHours), 
        teacher: subjectEditTeacher 
    });
    setIsSubjectEditDialogOpen(false);
    setEditingSubject(null);
    toast({ title: 'Materia Actualizada', description: 'Los datos de la materia se han guardado.' });
  };

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
                    <div key={field.id} className="flex items-center justify-between p-2 border rounded-md gap-2">
                      <div><p className="font-semibold">{field.name}</p><p className="text-sm text-muted-foreground">{field.availability}</p></div>
                       <div className="flex gap-2">
                        <Button type="button" variant="outline" size="icon" onClick={() => handleOpenTeacherEditDialog(index)}><Pencil className="h-4 w-4"/></Button>
                        <Button type="button" variant="destructive" size="icon" onClick={() => removeTeacher(index)}><Trash2 className="h-4 w-4"/></Button>
                      </div>
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
                <CardTitle>Progreso de Configuración</CardTitle>
                <CardDescription>Vista rápida de los grupos que ya tienen materias asignadas.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
                  {careers.map(career => (
                    <div key={career.id}>
                      <h4 className="font-semibold text-sm mb-2">{career.title}</h4>
                      <div className="flex flex-wrap gap-2">
                        {semesters.map(semester => {
                          const groupName = `${career.title} ${semester}° Semestre`;
                          const isConfigured = groups.includes(groupName);
                          return (
                            <Badge key={`${career.id}-${semester}`} variant={isConfigured ? 'default' : 'outline'} className="w-24 justify-center">
                              {semester}° Semestre
                            </Badge>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Grupos Configurados y Generación</CardTitle>
                    <CardDescription>Gestiona las materias de cada grupo y genera su horario individualmente.</CardDescription>
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
                                        <div key={subject.id} className="flex items-center justify-between p-2 border rounded-md gap-2">
                                            <div><p className="font-semibold">{subject.name} ({subject.hours}h)</p><p className="text-sm text-muted-foreground">{subject.teacher}</p></div>
                                            <div className="flex gap-2">
                                                <Button type="button" variant="outline" size="icon" onClick={() => handleOpenSubjectEditDialog(groupSubjectIndices[index])}><Pencil className="h-4 w-4"/></Button>
                                                <Button type="button" variant="destructive" size="icon" onClick={() => removeSubject(groupSubjectIndices[index])}><Trash2 className="h-4 w-4"/></Button>
                                            </div>
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
      
      {/* Teacher Edit Dialog */}
      <Dialog open={isTeacherEditDialogOpen} onOpenChange={setIsTeacherEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Docente</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="teacher-name" className="text-right">Nombre</Label>
              <Input id="teacher-name" value={teacherEditName} onChange={(e) => setTeacherEditName(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="teacher-availability" className="text-right">Disponibilidad</Label>
              <Input id="teacher-availability" value={teacherEditAvailability} onChange={(e) => setTeacherEditAvailability(e.target.value)} className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsTeacherEditDialogOpen(false)} variant="outline">Cancelar</Button>
            <Button onClick={handleUpdateTeacher}>Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Subject Edit Dialog */}
      <Dialog open={isSubjectEditDialogOpen} onOpenChange={setIsSubjectEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Materia</DialogTitle>
          </DialogHeader>
           <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Grupo</Label>
              <p className="col-span-3 text-sm text-muted-foreground">{editingSubject?.group}</p>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="subject-name" className="text-right">Materia</Label>
              <Input id="subject-name" value={subjectEditName} onChange={(e) => setSubjectEditName(e.target.value)} className="col-span-3" />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="subject-hours" className="text-right">Horas/Semana</Label>
              <Input id="subject-hours" type="number" value={subjectEditHours} onChange={(e) => setSubjectEditHours(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="subject-teacher" className="text-right">Docente</Label>
              <Select value={subjectEditTeacher} onValueChange={setSubjectEditTeacher}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Seleccionar Docente" />
                </SelectTrigger>
                <SelectContent>
                  {teacherFields.map((t) => (
                    <SelectItem key={t.name} value={t.name}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
             <Button onClick={() => setIsSubjectEditDialogOpen(false)} variant="outline">Cancelar</Button>
            <Button onClick={handleUpdateSubject}>Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
