'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { facilities as allFacilities } from "@/lib/data";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import Header from "@/components/header";
import { ScrollArea } from "@/components/ui/scroll-area";
import HomeMapContainer from "@/components/home-map-container";
import type { Facility } from '@/lib/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { LocateFixed, ArrowDown, Facebook, Instagram, Twitter } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import FacilityDetails from '@/components/facility-details';
import { sportsIconsMap, equipmentIconsMap } from '@/lib/icons';
import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [filteredFacilities, setFilteredFacilities] = useState<Facility[]>([]);
  
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [isIndoor, setIsIndoor] = useState(false);
  const [isOutdoor, setIsOutdoor] = useState(false);
  const [isAccessible, setIsAccessible] = useState(false);
  
  const [mapCenter, setMapCenter] = useState<[number, number]>([31.7917, -7.0926]);
  const [mapZoom, setMapZoom] = useState(6);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);

  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setFacilities(allFacilities);
  }, []);

  const { allSports, allRegions, allEquipments } = useMemo(() => {
    const sports = [...new Set(facilities.flatMap(f => f.sports))].sort();
    const regions = [...new Set(facilities.map(f => f.region))].sort();
    const equipments = [...new Set(facilities.flatMap(f => f.equipments.map(e => e.name)))].sort();
    return { allSports: sports, allRegions: regions, allEquipments: equipments };
  }, [facilities]);


  useEffect(() => {
    let newFilteredFacilities = facilities;

    if (selectedSports.length > 0) {
      newFilteredFacilities = newFilteredFacilities.filter(f => 
        selectedSports.some(sport => f.sports.includes(sport))
      );
    }

    if (selectedRegions.length > 0) {
      newFilteredFacilities = newFilteredFacilities.filter(f => 
        selectedRegions.includes(f.region)
      );
    }
    
    if (selectedEquipment.length > 0) {
        newFilteredFacilities = newFilteredFacilities.filter(f => 
            selectedEquipment.some(equip => f.equipments.map(e => e.name).includes(equip))
        );
    }

    if (isIndoor && !isOutdoor) {
        newFilteredFacilities = newFilteredFacilities.filter(f => f.type === 'indoor');
    } else if (!isIndoor && isOutdoor) {
        newFilteredFacilities = newFilteredFacilities.filter(f => f.type === 'outdoor');
    }

    if (isAccessible) {
        newFilteredFacilities = newFilteredFacilities.filter(f => f.accessible);
    }

    setFilteredFacilities(newFilteredFacilities);

  }, [selectedSports, selectedRegions, selectedEquipment, isIndoor, isOutdoor, isAccessible, facilities]);

  const handleCheckboxChange = (setter: React.Dispatch<React.SetStateAction<string[]>>, item: string, checked: boolean) => {
    setter(prev => checked ? [...prev, item] : prev.filter(i => i !== item));
  };
  
  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(position => {
        setMapCenter([position.coords.latitude, position.coords.longitude]);
        setMapZoom(13);
      }, () => {
        alert("Impossible de récupérer votre position.");
      });
    } else {
      alert("La géolocalisation n'est pas supportée par ce navigateur.");
    }
  };
  
  const clearFilters = () => {
      setSelectedSports([]);
      setSelectedRegions([]);
      setSelectedEquipment([]);
      setIsIndoor(false);
      setIsOutdoor(false);
      setIsAccessible(false);
      const checkboxes = document.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
      checkboxes.forEach(cb => cb.checked = false);
  };

  const handleMarkerClick = (facility: Facility) => {
    setSelectedFacility(facility);
  };

  const handleSheetClose = () => {
    setSelectedFacility(null);
  };

  const scrollToMap = () => {
    mapRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <section className="relative text-center py-20 px-4 sm:py-32 flex flex-col items-center justify-center overflow-hidden">
            <div className="absolute inset-0 z-0">
                <Image
                src="https://picsum.photos/seed/hero/1800/1000"
                alt="Ambiance de stade"
                fill
                className="object-cover opacity-20"
                priority
                data-ai-hint="stadium lights"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent"></div>
            </div>
            <div className="relative z-10 max-w-4xl mx-auto">
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold font-headline tracking-tight mb-4">
                Trouvez et Réservez Votre Terrain de Sport Idéal au Maroc
                </h1>
                <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                Explorez une carte interactive des installations sportives, filtrez par sport, équipement ou région, et réservez votre créneau en quelques clics.
                </p>
                <Button size="lg" onClick={scrollToMap}>
                Explorer la carte
                <ArrowDown className="ml-2 h-5 w-5" />
                </Button>
            </div>
        </section>

        <section ref={mapRef} id="map-section" className="relative py-12 md:py-20 bg-muted/50">
            <div className="container mx-auto relative h-[90vh]">
                <SidebarProvider>
                    <Sidebar collapsible="icon" variant="sidebar" className="absolute top-4 left-4 z-20 w-80 max-h-[calc(100%-2rem)] bg-card border shadow-lg rounded-lg">
                        <SidebarHeader className="flex items-center justify-between">
                            <h2 className="text-xl font-bold font-headline">Filtres</h2>
                            <Button onClick={handleLocateMe} variant="ghost" size="sm">
                                <LocateFixed className="h-5 w-5" />
                                <span>Me localiser</span>
                            </Button>
                        </SidebarHeader>
                        
                        <ScrollArea className="h-full">
                            <SidebarContent>
                                <Accordion type="multiple" defaultValue={['sport', 'region']} className="w-full">
                                    <AccordionItem value="sport">
                                        <AccordionTrigger className="px-4 py-2 text-base font-semibold">Sport</AccordionTrigger>
                                        <AccordionContent className="px-4">
                                        {allSports.map(sport => {
                                            const Icon = sportsIconsMap[sport];
                                            return (
                                            <div key={sport} className="flex items-center space-x-3 my-2">
                                                <Checkbox id={`sport-${sport}`} onCheckedChange={(checked) => handleCheckboxChange(setSelectedSports, sport, !!checked)} />
                                                <Label htmlFor={`sport-${sport}`} className="font-normal flex items-center gap-2">
                                                {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
                                                {sport}
                                                </Label>
                                            </div>
                                            )
                                        })}
                                        </AccordionContent>
                                    </AccordionItem>
                                    
                                    <AccordionItem value="region">
                                        <AccordionTrigger className="px-4 py-2 text-base font-semibold">Région</AccordionTrigger>
                                        <AccordionContent className="px-4">
                                        {allRegions.map(region => (
                                            <div key={region} className="flex items-center space-x-3 my-2">
                                            <Checkbox id={`region-${region}`} onCheckedChange={(checked) => handleCheckboxChange(setSelectedRegions, region, !!checked)} />
                                            <Label htmlFor={`region-${region}`} className="font-normal">{region}</Label>
                                            </div>
                                        ))}
                                        </AccordionContent>
                                    </AccordionItem>

                                    <AccordionItem value="equipment">
                                        <AccordionTrigger className="px-4 py-2 text-base font-semibold">Équipement</AccordionTrigger>
                                        <AccordionContent className="px-4">
                                        {allEquipments.map(equip => {
                                            const Icon = equipmentIconsMap[equip];
                                            return (
                                            <div key={equip} className="flex items-center space-x-3 my-2">
                                                <Checkbox id={`equip-${equip}`} onCheckedChange={(checked) => handleCheckboxChange(setSelectedEquipment, equip, !!checked)} />
                                                <Label htmlFor={`equip-${equip}`} className="font-normal flex items-center gap-2">
                                                {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
                                                {equip}
                                                </Label>
                                            </div>
                                            )
                                        })}
                                        </AccordionContent>
                                    </AccordionItem>
                                    
                                    <AccordionItem value="other">
                                        <AccordionTrigger className="px-4 py-2 text-base font-semibold">Autres</AccordionTrigger>
                                        <AccordionContent className="px-4">
                                        <div className="flex items-center space-x-3 my-2">
                                            <Checkbox id="type-indoor" checked={isIndoor} onCheckedChange={(checked) => setIsIndoor(!!checked)} />
                                            <Label htmlFor="type-indoor" className="font-normal">Intérieur</Label>
                                            </div>
                                            <div className="flex items-center space-x-3 my-2">
                                            <Checkbox id="type-outdoor" checked={isOutdoor} onCheckedChange={(checked) => setIsOutdoor(!!checked)} />
                                            <Label htmlFor="type-outdoor" className="font-normal">Extérieur</Label>
                                            </div>
                                            <div className="flex items-center space-x-3 my-2">
                                            <Checkbox id="accessible" checked={isAccessible} onCheckedChange={(checked) => setIsAccessible(!!checked)} />
                                            <Label htmlFor="accessible" className="font-normal">Accès PMR</Label>
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>
                            </SidebarContent>
                        </ScrollArea>
                        <SidebarFooter>
                            <Button onClick={clearFilters} variant="ghost">Effacer les filtres</Button>
                        </SidebarFooter>
                    </Sidebar>
                    
                    <div className="absolute inset-0 z-10 w-full h-full rounded-lg overflow-hidden shadow-lg border">
                        <HomeMapContainer 
                            facilities={filteredFacilities} 
                            center={mapCenter} 
                            zoom={mapZoom} 
                            onMarkerClick={handleMarkerClick}
                        />
                    </div>
                </SidebarProvider>
            </div>

            <Sheet open={!!selectedFacility} onOpenChange={(open) => !open && handleSheetClose()}>
                <SheetContent className="w-full sm:max-w-xl p-0 overflow-y-auto">
                    {selectedFacility && (
                        <>
                            <SheetHeader className="p-6">
                                <SheetTitle className="font-headline text-3xl">{selectedFacility.name}</SheetTitle>
                                <SheetDescription>{selectedFacility.city}, {selectedFacility.region}</SheetDescription>
                            </SheetHeader>
                            <FacilityDetails facility={selectedFacility} />
                        </>
                    )}
                </SheetContent>
            </Sheet>
        </section>
      </main>

      <footer className="bg-card border-t">
        <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <h3 className="text-xl font-headline font-semibold">Maroc Sport Hub</h3>
              <p className="text-muted-foreground text-sm">Votre portail unique pour trouver et réserver des installations sportives à travers le Maroc.</p>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-card-foreground/90">Navigation</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/" className="text-muted-foreground hover:text-primary">Accueil</Link></li>
                <li><Link href="/profile" className="text-muted-foreground hover:text-primary">Mon Profil</Link></li>
                <li><Link href="/dashboard" className="text-muted-foreground hover:text-primary">Dashboard</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-card-foreground/90">Légal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-muted-foreground hover:text-primary">Conditions d'utilisation</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary">Politique de confidentialité</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-card-foreground/90">Suivez-nous</h4>
              <div className="flex space-x-4">
                <a href="#" className="text-muted-foreground hover:text-primary"><Facebook className="h-6 w-6" /></a>
                <a href="#" className="text-muted-foreground hover:text-primary"><Instagram className="h-6 w-6" /></a>
                <a href="#" className="text-muted-foreground hover:text-primary"><Twitter className="h-6 w-6" /></a>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Maroc Sport Hub. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

    