'use client';

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation";
import { signInUser } from "@/lib/firebase/auth";
import { useState } from "react";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  email: z.string().email("Por favor, introduce un correo electrónico válido."),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres."),
})

export default function LoginPage() {
  const { toast } = useToast()
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })
 
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      await signInUser(values.email, values.password);
      toast({
        title: "Inicio de Sesión Exitoso",
        description: "Bienvenido al panel de administración.",
      });
      router.push('/admin/eventos');
    } catch (error: any) {
      console.error(error);
      let description = "El correo electrónico o la contraseña son incorrectos.";
      if (error.message?.includes("Firebase")) {
          description = "Error de Firebase: Es posible que la configuración no sea correcta. Contacta al administrador."
      }
      toast({
        variant: "destructive",
        title: "Error de Autenticación",
        description: description,
      });
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
            <CardTitle className="text-2xl">Panel de Administración</CardTitle>
            <CardDescription>Inicia sesión para gestionar el contenido.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo Electrónico</FormLabel>
                    <FormControl>
                      <Input placeholder="admin@cbtis294.edu.mx" {...field} type="email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <Input placeholder="******" {...field} type="password"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Iniciar Sesión
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
