'use client';

import type { Facility, Reservation, Equipment } from '@/lib/types';
import { useState } from 'react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, MapPin, Accessibility, Sun, Moon, Wallet, ShieldCheck, Clock, Sprout } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { sportsIconsMap, equipmentIconsMap } from '@/lib/icons';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export default function FacilityDetails({ facility }: { facility: Facility }) {
  const { user } = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  
  const equipmentsCollectionRef = useMemoFirebase(() => collection(firestore, 'equipments'), [firestore]);
  const { data: allEquipments } = useCollection<Equipment>(equipmentsCollectionRef);

  const facilityEquipments = allEquipments?.filter(e => facility.equipmentIds?.includes(e.id)) || [];

  const handleBooking = async () => {
    if (!user || !user.email) {
      toast({
        variant: "destructive",
        title: "Vous n'êtes pas connecté",
        description: "Veuillez vous connecter pour faire une réservation.",
      });
      router.push('/login');
      return;
    }

    if (!selectedDate || !selectedTime) {
      toast({
        variant: "destructive",
        title: "Sélection manquante",
        description: "Veuillez sélectionner une date et un créneau horaire.",
      });
      return;
    }

    setIsBooking(true);

    try {
      const [startTimeStr] = selectedTime.split(' - ');
      const [hour] = startTimeStr.split(':');
      
      const startDate = new Date(selectedDate);
      startDate.setHours(parseInt(hour, 10), 0, 0, 0);

      const endDate = new Date(startDate);
      endDate.setHours(startDate.getHours() + 1);

      const newReservation: Omit<Reservation, 'id'> = {
        userId: user.uid,
        userEmail: user.email,
        facilityId: facility.id,
        startTime: startDate,
        endTime: endDate,
        status: 'confirmed',
        totalCost: facility.rentalCost,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      const userReservationsRef = collection(firestore, 'users', user.uid, 'reservations');
      await addDoc(userReservationsRef, newReservation);
      
      const allReservationsRef = collection(firestore, 'reservations');
      await addDoc(allReservationsRef, newReservation);

      toast({
        title: "Réservation confirmée !",
        description: `Votre créneau pour ${facility.name} est réservé.`,
      });
      setSelectedTime(null);
    } catch (error) {
      console.error("Booking error:", error);
      toast({
        variant: "destructive",
        title: "Une erreur est survenue",
        description: "Votre réservation n'a pas pu être effectuée. Veuillez réessayer.",
      });
    } finally {
      setIsBooking(false);
    }
  };
  
  const todayStr = (selectedDate || new Date()).toISOString().split('T')[0];
  const availableSlots = facility.availability?.[todayStr] || [];

  return (
    <div className="space-y-6 pb-6">
      <div className="relative w-full h-64">
        <Image
          src={facility.photos?.[0] || 'https://picsum.photos/seed/facility/800/600'}
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
            const Icon = sportsIconsMap[sport] || Sprout;
            return (
              <Badge key={sport} variant="secondary" className="flex items-center gap-1.5 py-1 px-2">
                <Icon className="w-3.5 h-3.5" />
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
        <div className="flex items-center gap-3"><Wallet/> {facility.rentalCost} MAD/heure</div>
        <div className="flex items-center gap-3"><ShieldCheck/> Caution: {facility.depositCost > 0 ? `${facility.depositCost} MAD` : 'Aucune'}</div>
      </div>

      {facilityEquipments.length > 0 && <Separator />}

      {facilityEquipments.length > 0 && (
        <div className="px-6">
          <h3 className="text-lg font-semibold mb-3">Équipements Inclus</h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {facilityEquipments.map(equip => {
              const Icon = equipmentIconsMap[equip.name] || Sprout;
              return (
                <div key={equip.id} className="flex items-center gap-3 text-muted-foreground">
                  <Icon className="w-4 h-4" />
                  <span>{equip.name}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

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
                    disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
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
                <Button className="w-full mt-4" size="lg" onClick={handleBooking} disabled={!selectedTime || isBooking}>
                    {isBooking ? "Réservation en cours..." : "Réserver maintenant"}
                </Button>
            </div>
        </div>
      </div>
    </div>
  );
}
