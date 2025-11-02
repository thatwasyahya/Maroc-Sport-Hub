import { facilities } from "@/lib/data";
import Header from "@/components/header";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MapPin, Accessibility, Sun, Moon, Armchair } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Calendar as BookingCalendar } from "@/components/ui/calendar";

export default function FacilityPage({ params }: { params: { id: string } }) {
  const facility = facilities.find((f) => f.id === params.id);

  if (!facility) {
    notFound();
  }

  return (
    <div className="min-h-screen w-full flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto py-8 px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <div className="relative w-full h-96 rounded-lg overflow-hidden shadow-lg mb-6">
                <Image
                  src={facility.photos[0]}
                  alt={facility.name}
                  layout="fill"
                  objectFit="cover"
                  data-ai-hint="sports facility"
                />
              </div>
              <h1 className="text-4xl font-bold font-headline mb-2">{facility.name}</h1>
              <div className="flex items-center text-muted-foreground mb-4">
                <MapPin className="w-4 h-4 mr-2" />
                <span>{facility.city}, {facility.region}</span>
              </div>
              <div className="flex flex-wrap gap-2 mb-6">
                {facility.sports.map(sport => <Badge key={sport} variant="secondary">{sport}</Badge>)}
              </div>
              <p className="text-lg mb-6">{facility.description}</p>
              
              <Separator className="my-6" />

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-6">
                  <div className="flex items-center gap-2"><Accessibility/> {facility.accessible ? "Accessible" : "Not Accessible"}</div>
                  <div className="flex items-center gap-2">{facility.type === "indoor" ? <Moon /> : <Sun />} {facility.type.charAt(0).toUpperCase() + facility.type.slice(1)}</div>
              </div>

              <h2 className="text-2xl font-bold font-headline mb-4">Equipment</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {facility.equipments.map(eq => (
                      <Card key={eq.id} className="bg-secondary/50">
                          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                              <Armchair className="w-8 h-8 mb-2 text-primary"/>
                              <p className="font-semibold">{eq.name}</p>
                              <p className="text-sm text-muted-foreground">Quantity: {eq.quantity}</p>
                          </CardContent>
                      </Card>
                  ))}
              </div>

            </div>
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="font-headline flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Book a Slot
                  </CardTitle>
                </CardHeader>
                <CardContent>
                    <BookingCalendar
                        mode="single"
                        selected={new Date()}
                        className="rounded-md border"
                    />
                    <div className="mt-4">
                        <h3 className="font-semibold mb-2">Available Times for Today</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {facility.availability[new Date().toISOString().split('T')[0]]?.slice(0, 6).map(slot => (
                                <Button key={slot} variant="outline">{slot}</Button>
                            ))}
                        </div>
                        <Button className="w-full mt-4">Book Now</Button>
                    </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
