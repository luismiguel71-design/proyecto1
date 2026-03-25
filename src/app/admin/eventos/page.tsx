'use client';
import { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { getEvents } from '@/lib/firebase/firestore';
import { Evento } from '@/lib/types';
import Image from 'next/image';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getCurrentUser } from '@/lib/firebase/auth';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { addEventAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';

const eventFormSchema = z.object({
  title: z.string().min(5, 'El título debe tener al menos 5 caracteres.'),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres.'),
  imageUrl: z.string().url('Por favor, introduce una URL de imagen válida. Te recomendamos usar https://picsum.photos/'),
});

type EventFormValues = z.infer<typeof eventFormSchema>;

export default function AdminEventosPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Evento[]>([]);
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: '',
      description: '',
      imageUrl: '',
    },
  });

  useEffect(() => {
    const unsubscribe = getCurrentUser((user) => {
      if (user) {
        setUser(user);
        fetchEvents();
      } else {
        router.push('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const fetchEvents = async () => {
    const eventsFromDb = await getEvents();
    setEvents(eventsFromDb);
  };

  async function onSubmit(data: EventFormValues) {
    setIsSubmitting(true);
    const result = await addEventAction(data);
    
    if (result.error) {
      toast({
        variant: "destructive",
        title: "Error al crear evento",
        description: result.error,
      });
    } else {
      toast({
        title: "Evento Creado",
        description: "El nuevo evento se ha guardado correctamente.",
      });
      form.reset();
      await fetchEvents();
      setIsDialogOpen(false);
    }
    setIsSubmitting(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null; // The redirect is handled in the effect
  }

  return (
    <div className="container py-10">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Gestionar Noticias y Eventos</CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>Crear Nuevo Evento</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Crear Nuevo Evento</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Título</FormLabel>
                          <FormControl>
                            <Input placeholder="Título del evento" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descripción</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe el evento"
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="imageUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>URL de la Imagen</FormLabel>
                          <FormControl>
                            <Input placeholder="https://picsum.photos/seed/..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Guardar Evento
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {events.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <Image
                    src={
                      event.imageUrl ||
                      `https://picsum.photos/seed/event${event.id}/100/100`
                    }
                    alt={event.title}
                    width={80}
                    height={80}
                    className="rounded-md object-cover"
                  />
                  <div>
                    <h3 className="font-semibold">{event.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {format(event.date.toDate(), "d 'de' MMMM 'de' yyyy", {
                        locale: es,
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => alert('Función no implementada.')}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => alert('Función no implementada.')}
                  >
                    Eliminar
                  </Button>
                </div>
              </div>
            ))}
          </div>
          {events.length === 0 && (
            <p className="text-center py-8 text-muted-foreground">
              No hay eventos para mostrar. ¡Crea el primero!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
