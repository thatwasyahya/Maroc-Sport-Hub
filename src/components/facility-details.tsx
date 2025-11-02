'use client';

import type { Facility } from '@/lib/types';
import { useState } from 'react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar as CalendarIcon, MapPin, Accessibility, Sun, Moon, Armchair, Wallet, ShieldCheck, Clock, User } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { sportsIconsMap, equipmentIconsMap } from '@/lib/icons';
import { useToast } from '@/hooks/use-toast';

export default function FacilityDetails({ facility }: { facility: Facility }) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const { toast } = useToast();

  const handleBooking = () => {
    if (selectedDate && selectedTime) {
      toast({
        title: "Réservation confirmée (simulation)",
        description: `Votre créneau pour ${facility.name} le ${selectedDate.toLocaleDateString()} de ${selectedTime} est réservé.`,
      });
    } else {
       toast({
        variant: "destructive",
        title: "Sélection manquante",
        description: "Veuillez sélectionner une date et un créneau horaire.",
      });
    }
  };
  
  const todayStr = (selectedDate || new Date()).toISOString().split('T')[0];
  const availableSlots = facility.availability[todayStr] || [];

  return (
    <div className="space-y-6 pb-6">
      <div className="relative w-full h-64">
        <Image
          src={facility.photos[0]}
          alt={facility.name}
          fill
          className="object-cover"
          data-ai-hint="sports facility"
        />
      </div>
      
      <div className="px-6">
        <div className="flex items-center text-muted-foreground text-sm mb-4">
          <MapPin className="w-4 h-4 mr-2" />
          <span>{facility.address}</span>
        </div>
        <div className="flex flex-wrap gap-2 mb-6">
          {facility.sports.map(sport => {
            const Icon = sportsIconsMap[sport];
            return (
              <Badge key={sport} variant="secondary" className="flex items-center gap-1.5 py-1 px-2">
                {Icon && <Icon className="w-3.5 h-3.5" />}
                {sport}
              </Badge>
            )
          })}
        </div>
        <p className="text-muted-foreground mb-6">{facility.description}</p>
      </div>
      
      <Separator />

      <div className="px-6 grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center gap-3"><Accessibility/> {facility.accessible ? "Accès PMR" : "Non accessible PMR"}</div>
        <div className="flex items-center gap-3">{facility.type === "indoor" ? <Moon /> : <Sun />} {facility.type.charAt(0).toUpperCase() + facility.type.slice(1)}</div>
        <div className="flex items-center gap-3"><Wallet/> {facility.pricePerHour} MAD/heure</div>
        <div className="flex items-center gap-3"><ShieldCheck/> Caution: {facility.deposit > 0 ? `${facility.deposit} MAD` : 'Aucune'}</div>
      </div>

      <Separator />

      <div className="px-6">
        <h3 className="text-xl font-headline font-semibold mb-4">Équipements disponibles</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {facility.equipments.map(eq => {
              const Icon = equipmentIconsMap[eq.name] || Armchair;
              return (
                <Card key={eq.id} className="bg-secondary/50">
                    <CardContent className="p-3 text-center">
                        <Icon className="w-7 h-7 mb-2 text-primary mx-auto"/>
                        <p className="font-semibold text-sm">{eq.name}</p>
                        <p className="text-xs text-muted-foreground">x{eq.quantity}</p>
                    </CardContent>
                </Card>
              )
            })}
        </div>
      </div>

      <Separator />

      <div className="px-6">
        <h3 className="text-xl font-headline font-semibold mb-4 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Réserver un créneau
        </h3>
        <div className="sm:flex sm:gap-6">
            <div className="flex justify-center">
                <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border"
                />
            </div>
            <div className="mt-4 sm:mt-0 flex-1">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4"/>
                    Créneaux pour le {selectedDate ? selectedDate.toLocaleDateString() : '...'}
                </h4>
                {availableSlots.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {availableSlots.map(slot => (
                          <Button 
                            key={slot} 
                            variant={selectedTime === slot ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSelectedTime(slot)}
                          >
                            {slot}
                          </Button>
                      ))}
                  </div>
                ) : (
                    <p className="text-sm text-muted-foreground text-center bg-muted/50 rounded-md p-4">
                        Aucun créneau disponible pour cette date.
                    </p>
                )}
                <Button className="w-full mt-4" size="lg" onClick={handleBooking} disabled={!selectedTime}>
                    Réserver maintenant
                </Button>
            </div>
        </div>
      </div>
    </div>
  );
}
