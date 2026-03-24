import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  BookOpen,
  GraduationCap,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { careers } from '@/app/lib/school-data';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const heroImage = PlaceHolderImages.find((img) => img.id === 'hero-students-laughing');

export default function Home() {
  return (
    <div className="flex flex-col">
      <section className="relative h-[60vh] md:h-[70vh] w-full flex items-center justify-center text-center text-white">
        {heroImage && (
          <Image
            src={heroImage.imageUrl}
            alt={heroImage.description}
            fill
            className="object-cover"
            priority
            data-ai-hint={heroImage.imageHint}
          />
        )}
        <div className="absolute inset-0 bg-primary/70" />
        <div className="relative z-10 container px-4 md:px-6 flex flex-col items-center">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter mb-4 animate-fade-in-down">
            CBTIS No. 294
          </h1>
          <p className="max-w-3xl mx-auto text-lg md:text-xl text-primary-foreground/90 mb-8 animate-fade-in-up">
            Formando líderes para el futuro tecnológico y de servicios.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild size="lg" className="animate-fade-in">
              <Link href="/carreras">
                Nuestra Oferta Educativa <ArrowRight className="ml-2" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/admisiones">Proceso de Admisión</Link>
            </Button>
          </div>
        </div>
      </section>

      <section id="carreras" className="py-16 md:py-24 bg-background">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-primary">
              Oferta Educativa
            </h2>
            <p className="mt-2 text-lg text-muted-foreground max-w-2xl mx-auto">
              Explora nuestras carreras técnicas diseñadas para el éxito
              profesional en industrias de alta demanda.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {careers.map((career) => {
              const careerImage = PlaceHolderImages.find((img) => img.id === career.image);
              return (
                <Card
                  key={career.id}
                  className="overflow-hidden transform hover:-translate-y-2 transition-transform duration-300 ease-in-out shadow-lg hover:shadow-2xl"
                >
                  {careerImage && (
                    <div className="relative h-48 w-full">
                      <Image
                        src={careerImage.imageUrl}
                        alt={career.title}
                        fill
                        className="object-cover"
                        data-ai-hint={careerImage.imageHint}
                      />
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-primary">{career.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="line-clamp-3">
                      {career.description}
                    </CardDescription>
                    <Button asChild variant="link" className="px-0 mt-4">
                      <Link href={`/carreras/${career.slug}`}>
                        Saber más <ArrowRight className="ml-1" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>
      
      <section className="py-16 md:py-24 bg-card">
        <div className="container px-4 md:px-6 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-primary">
              Sobre Nuestra Institución
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Nuestra misión es ofrecer educación de nivel medio superior técnico, formando estudiantes competentes y preparados para el sector laboral y la continuación de estudios superiores.
            </p>
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex items-start gap-4">
                    <div className="bg-primary/10 text-primary p-3 rounded-full">
                        <GraduationCap />
                    </div>
                    <div>
                        <h3 className="font-semibold">Educación de Calidad</h3>
                        <p className="text-muted-foreground text-sm">Planes de estudio actualizados y relevantes.</p>
                    </div>
                </div>
                <div className="flex items-start gap-4">
                    <div className="bg-primary/10 text-primary p-3 rounded-full">
                        <Users />
                    </div>
                    <div>
                        <h3 className="font-semibold">Docentes Expertos</h3>
                        <p className="text-muted-foreground text-sm">Profesionales con experiencia en su campo.</p>
                    </div>
                </div>
                 <div className="flex items-start gap-4">
                    <div className="bg-primary/10 text-primary p-3 rounded-full">
                        <BookOpen />
                    </div>
                    <div>
                        <h3 className="font-semibold">Recursos Modernos</h3>
                        <p className="text-muted-foreground text-sm">Instalaciones y laboratorios equipados.</p>
                    </div>
                </div>
                 <div className="flex items-start gap-4">
                    <div className="bg-primary/10 text-primary p-3 rounded-full">
                        <ArrowRight />
                    </div>
                    <div>
                        <h3 className="font-semibold">Visión de Futuro</h3>
                        <p className="text-muted-foreground text-sm">Preparación para la universidad y el trabajo.</p>
                    </div>
                </div>
            </div>
          </div>
          <div>
            <div className="relative aspect-video rounded-lg overflow-hidden shadow-lg">
                <Image
                    src="https://picsum.photos/seed/schoolcampus/600/400"
                    alt="Campus del CBTIS 294"
                    fill
                    className="object-cover"
                    data-ai-hint="school campus"
                />
            </div>
          </div>
        </div>
      </section>

      <section id="noticias" className="py-16 md:py-24 bg-background">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-primary">
              Últimas Noticias y Eventos
            </h2>
            <p className="mt-2 text-lg text-muted-foreground">
              Mantente al día con las novedades de nuestra comunidad escolar.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((item) => (
              <Card key={item} className="shadow-lg">
                <CardHeader>
                  <div className="aspect-video bg-muted rounded-md mb-4 overflow-hidden relative">
                    <Image
                        src={`https://picsum.photos/seed/news${item}/600/400`}
                        alt={`Noticia ${item}`}
                        fill
                        className="object-cover"
                        data-ai-hint="student event"
                    />
                  </div>
                  <CardTitle>Evento Importante {item}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Una breve descripción sobre la noticia o el evento que se
                    está llevando a cabo en la institución.
                  </CardDescription>
                  <Button variant="link" className="px-0 mt-2">
                    Leer más
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
