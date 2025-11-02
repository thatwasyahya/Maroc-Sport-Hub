"use client";

import { useState, useEffect, useMemo } from 'react';
import { facilities } from "@/lib/data";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarInset,
} from "@/components/ui/sidebar";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import Header from "@/components/header";
import { ScrollArea } from "@/components/ui/scroll-area";
import HomeMapContainer from "@/components/home-map-container";
import type { Facility } from '@/lib/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { LocateFixed } from 'lucide-react';
import { Input } from '@/components/ui/input';


const allSports = [...new Set(facilities.flatMap(f => f.sports))].sort();
const allRegions = [...new Set(facilities.map(f => f.region))].sort();
const allEquipments = [...new Set(facilities.flatMap(f => f.equipments.map(e => e.name)))].sort();

export default function Home() {
  const [filteredFacilities, setFilteredFacilities] = useState<Facility[]>(facilities);
  
  // Filter states
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [isIndoor, setIsIndoor] = useState(false);
  const [isOutdoor, setIsOutdoor] = useState(false);
  const [isAccessible, setIsAccessible] = useState(false);

  // Map state
  const [mapCenter, setMapCenter] = useState<[number, number]>([31.7917, -7.0926]); // Default center of Morocco
  const [mapZoom, setMapZoom] = useState(6);


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

  }, [selectedSports, selectedRegions, selectedEquipment, isIndoor, isOutdoor, isAccessible]);

  const handleCheckboxChange = (setter: React.Dispatch<React.SetStateAction<string[]>>, item: string, checked: boolean) => {
    setter(prev => checked ? [...prev, item] : prev.filter(i => i !== item));
  };
  
  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(position => {
        setMapCenter([position.coords.latitude, position.coords.longitude]);
        setMapZoom(13);
      }, () => {
        alert("Unable to retrieve your location.");
      });
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <SidebarProvider>
          <Sidebar collapsible="icon" className="w-80">
            <SidebarHeader className="flex items-center justify-between">
              <h2 className="text-xl font-bold font-headline">Filters</h2>
              <Button onClick={handleLocateMe} variant="ghost" size="sm">
                <LocateFixed className="mr-2 h-4 w-4" />
                Find Near Me
              </Button>
            </SidebarHeader>
            
            <ScrollArea className="h-full">
              <SidebarContent>
                <Accordion type="multiple" defaultValue={['sport', 'region']} className="w-full">
                  
                  <AccordionItem value="sport">
                    <AccordionTrigger className="px-4 py-2 text-base font-semibold">Sport</AccordionTrigger>
                    <AccordionContent className="px-4">
                      {allSports.map(sport => (
                        <div key={sport} className="flex items-center space-x-2 my-2">
                          <Checkbox id={`sport-${sport}`} onCheckedChange={(checked) => handleCheckboxChange(setSelectedSports, sport, !!checked)} />
                          <Label htmlFor={`sport-${sport}`} className="font-normal">{sport}</Label>
                        </div>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="region">
                    <AccordionTrigger className="px-4 py-2 text-base font-semibold">Region</AccordionTrigger>
                    <AccordionContent className="px-4">
                      {allRegions.map(region => (
                        <div key={region} className="flex items-center space-x-2 my-2">
                          <Checkbox id={`region-${region}`} onCheckedChange={(checked) => handleCheckboxChange(setSelectedRegions, region, !!checked)} />
                          <Label htmlFor={`region-${region}`} className="font-normal">{region}</Label>
                        </div>
                      ))}
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="equipment">
                    <AccordionTrigger className="px-4 py-2 text-base font-semibold">Equipment</AccordionTrigger>
                    <AccordionContent className="px-4">
                      {allEquipments.map(equip => (
                        <div key={equip} className="flex items-center space-x-2 my-2">
                          <Checkbox id={`equip-${equip}`} onCheckedChange={(checked) => handleCheckboxChange(setSelectedEquipment, equip, !!checked)} />
                          <Label htmlFor={`equip-${equip}`} className="font-normal">{equip}</Label>
                        </div>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="other">
                    <AccordionTrigger className="px-4 py-2 text-base font-semibold">Other</AccordionTrigger>
                    <AccordionContent className="px-4">
                       <div className="flex items-center space-x-2 my-2">
                          <Checkbox id="type-indoor" checked={isIndoor} onCheckedChange={(checked) => setIsIndoor(!!checked)} />
                          <Label htmlFor="type-indoor" className="font-normal">Indoor</Label>
                        </div>
                        <div className="flex items-center space-x-2 my-2">
                          <Checkbox id="type-outdoor" checked={isOutdoor} onCheckedChange={(checked) => setIsOutdoor(!!checked)} />
                          <Label htmlFor="type-outdoor" className="font-normal">Outdoor</Label>
                        </div>
                        <div className="flex items-center space-x-2 my-2">
                          <Checkbox id="accessible" checked={isAccessible} onCheckedChange={(checked) => setIsAccessible(!!checked)} />
                          <Label htmlFor="accessible" className="font-normal">Accessible</Label>
                        </div>
                    </AccordionContent>
                  </AccordionItem>

                </Accordion>
              </SidebarContent>
            </ScrollArea>
          </Sidebar>
          <SidebarInset className="p-0 overflow-hidden">
             <HomeMapContainer facilities={filteredFacilities} center={mapCenter} zoom={mapZoom} />
          </SidebarInset>
        </SidebarProvider>
      </div>
    </div>
  );
}
