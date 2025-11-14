
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
} from "@/components/ui/sidebar";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import Header from "@/components/header";
import { ScrollArea } from "@/components/ui/scroll-area";
import HomeMapContainer from "@/components/home-map-container";
import type { Facility, Settings } from '@/lib/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from "@/components/ui/button";
import { LocateFixed, ArrowDown, Facebook, Instagram, Twitter, SlidersHorizontal, Trash2, Activity, Menu, Map, List, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import FacilityDetails from '@/components/facility-details';
import { sportsIconsMap, equipmentIconsMap } from '@/lib/icons';
import Image from 'next/image';
import { getRegions } from '@/lib/maroc-api';
import { Skeleton } from '@/components/ui/skeleton';
import {useTranslations} from 'next-intl';
import { defaultData } from '@/lib/data';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { InterceptedLink } from '@/components/intercepted-link';


function Filters({ allSports, allRegions, allEquipments, selectedSports, setSelectedSports, selectedRegions, setSelectedRegions, selectedEquipment, setSelectedEquipment, isIndoor, setIsIndoor, isOutdoor, setIsOutdoor, isAccessible, setIsAccessible, clearFilters }: any) {
  const t = useTranslations('Home');
  
  const handleCheckboxChange = (setter: React.Dispatch<React.SetStateAction<string[]>>, item: string, checked: boolean) => {
    setter(prev => checked ? [...prev, item] : prev.filter(i => i !== item));
  };
  
  return (
    <>
      <ScrollArea className="h-full pr-4">
        <Accordion type="multiple" defaultValue={['sport', 'region']} className="w-full">
          <AccordionItem value="sport">
            <AccordionTrigger className="px-4 py-3 text-base font-semibold">{t('filterSport')}</AccordionTrigger>
            <AccordionContent className="px-4">
            {allSports.map((sport:string) => {
                const Icon = sportsIconsMap[sport];
                return (
                <div key={sport} className="flex items-center space-x-3 my-3">
                    <Checkbox id={`sport-${sport}`} onCheckedChange={(checked) => handleCheckboxChange(setSelectedSports, sport, !!checked)} checked={selectedSports.includes(sport)} />
                    <Label htmlFor={`sport-${sport}`} className="font-normal flex items-center gap-2 cursor-pointer">
                    {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
                    {sport}
                    </Label>
                </div>
                )
            })}
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="region">
            <AccordionTrigger className="px-4 py-3 text-base font-semibold">{t('filterRegion')}</AccordionTrigger>
            <AccordionContent className="px-4">
            {allRegions.map((region:string) => (
                <div key={region} className="flex items-center space-x-3 my-3">
                <Checkbox id={`region-${region}`} onCheckedChange={(checked) => handleCheckboxChange(setSelectedRegions, region, !!checked)} checked={selectedRegions.includes(region)} />
                <Label htmlFor={`region-${region}`} className="font-normal cursor-pointer">{region}</Label>
                </div>
            ))}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="equipment">
            <AccordionTrigger className="px-4 py-3 text-base font-semibold">{t('filterEquipment')}</AccordionTrigger>
            <AccordionContent className="px-4">
            {allEquipments.map((equip:string) => {
                const Icon = equipmentIconsMap[equip];
                return (
                <div key={equip} className="flex items-center space-x-3 my-3">
                    <Checkbox id={`equip-${equip}`} onCheckedChange={(checked) => handleCheckboxChange(setSelectedEquipment, equip, !!checked)} checked={selectedEquipment.includes(equip)}/>
                    <Label htmlFor={`equip-${equip}`} className="font-normal flex items-center gap-2 cursor-pointer">
                    {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
                    {equip}
                    </Label>
                </div>
                )
            })}
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="other">
            <AccordionTrigger className="px-4 py-3 text-base font-semibold">{t('filterOther')}</AccordionTrigger>
            <AccordionContent className="px-4">
            <div className="flex items-center space-x-3 my-3">
                <Checkbox id="type-indoor" checked={isIndoor} onCheckedChange={(checked) => setIsIndoor(!!checked)} />
                <Label htmlFor="type-indoor" className="font-normal cursor-pointer">{t('filterIndoor')}</Label>
                </div>
                <div className="flex items-center space-x-3 my-3">
                <Checkbox id="type-outdoor" checked={isOutdoor} onCheckedChange={(checked) => setIsOutdoor(!!checked)} />
                <Label htmlFor="type-outdoor" className="font-normal cursor-pointer">{t('filterOutdoor')}</Label>
                </div>
                <div className="flex items-center space-x-3 my-3">
                <Checkbox id="accessible" checked={isAccessible} onCheckedChange={(checked) => setIsAccessible(!!checked)} />
                <Label htmlFor="accessible" className="font-normal cursor-pointer">{t('filterAccessible')}</Label>
                </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </ScrollArea>
      <div className='p-4 border-t border-border/50'>
        <Button onClick={clearFilters} variant="ghost" className="w-full">
            <Trash2 className="w-4 h-4 mr-2"/>
            {t('clearFilters')}
        </Button>
      </div>
    </>
  )
}

function FacilitiesTable({ facilities, onRowClick }: { facilities: Facility[], onRowClick: (facility: Facility) => void }) {
  const t = useTranslations('Dashboard.Facilities');
  return (
    <div className="overflow-x-auto h-full w-full">
      <Table>
        <TableHeader className="sticky top-0 bg-card/80 backdrop-blur-sm z-10">
          <TableRow>
            <TableHead>{t('tableHeaderName')}</TableHead>
            <TableHead className="hidden sm:table-cell">Province</TableHead>
            <TableHead className="hidden lg:table-cell">Commune</TableHead>
            <TableHead className="hidden md:table-cell">{t('tableHeaderSports')}</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {facilities.length > 0 ? facilities.map(facility => (
            <TableRow key={facility.id} className="cursor-pointer" onClick={() => onRowClick(facility)}>
              <TableCell className="font-medium">{facility.name}</TableCell>
              <TableCell className="hidden sm:table-cell">{facility.province}</TableCell>
              <TableCell className="hidden lg:table-cell">{facility.commune}</TableCell>
              <TableCell className="hidden md:table-cell">
                <div className="flex flex-wrap gap-1 max-w-xs">
                  {(facility.sports || []).slice(0, 3).map((sport) => (
                    <Badge key={sport} variant="outline">{sport}</Badge>
                  ))}
                  {(facility.sports || []).length > 3 && <Badge variant="outline">...</Badge>}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon">
                  <Eye className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          )) : (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                {t('noFacilities')}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

export default function Home() {
  const t = useTranslations('Home');
  const isMobile = useIsMobile();
  const firestore = useFirestore();

  const settingsDocRef = useMemoFirebase(() => (
    firestore ? doc(firestore, 'settings', 'global') : null
  ), [firestore]);
  const { data: settings } = useDoc<Settings>(settingsDocRef);
  
  const [allFacilities] = useState<Facility[]>(defaultData.facilities);
  const [facilitiesLoading] = useState(false);

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

  const [viewMode, setViewMode] = useState<'map' | 'table'>('map');

  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setFacilities(allFacilities);
  }, [allFacilities]);

  const { allSports, allRegions, allEquipments } = useMemo(() => {
    const sports = [...new Set(facilities.flatMap(f => f.sports || []))].sort();
    const regions = getRegions().map(r => r.name).sort();
    const equipments = [...new Set(facilities.flatMap(f => f.equipments?.map(e => e.name) || []))].sort();
    return { allSports: sports, allRegions: regions, allEquipments: equipments };
  }, [facilities]);


  useEffect(() => {
    let newFilteredFacilities = facilities;

    if (selectedSports.length > 0) {
      newFilteredFacilities = newFilteredFacilities.filter(f => 
        selectedSports.some(sport => f.sports?.includes(sport))
      );
    }

    if (selectedRegions.length > 0) {
      newFilteredFacilities = newFilteredFacilities.filter(f => 
        f.region && selectedRegions.includes(f.region)
      );
    }
    
    if (selectedEquipment.length > 0) {
        newFilteredFacilities = newFilteredFacilities.filter(f => 
            f.equipments && selectedEquipment.some(equipName => f.equipments.some(e => e.name === equipName))
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

  
  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(position => {
        setMapCenter([position.coords.latitude, position.coords.longitude]);
        setMapZoom(13);
      }, () => {
        alert(t('locateError'));
      });
    } else {
      alert(t('geolocationNotSupported'));
    }
  };
  
  const clearFilters = () => {
      setSelectedSports([]);
      setSelectedRegions([]);
      setSelectedEquipment([]);
      setIsIndoor(false);
      setIsOutdoor(false);
      setIsAccessible(false);
  };

  const handleMarkerClick = (facility: Facility) => {
    setSelectedFacility(facility);
  };

  const handleDialogClose = () => {
    setSelectedFacility(null);
  };

  const scrollToMap = () => {
    mapRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const filterProps = { allSports, allRegions, allEquipments, selectedSports, setSelectedSports, selectedRegions, setSelectedRegions, selectedEquipment, setSelectedEquipment, isIndoor, setIsIndoor, isOutdoor, setIsOutdoor, isAccessible, setIsAccessible, clearFilters };
  
  const appName = settings?.appName || t('appName');
  const footerDescription = settings?.footerDescription || t('footerDescription');
  const heroTitle = settings?.heroTitle || t('heroTitle');
  const heroSubtitle = settings?.heroSubtitle || t('heroSubtitle');
  const footerLinks = settings?.footerLinks || [
      { label: t('footerHome'), url: '/' },
      { label: t('footerProfile'), url: '/profile' },
      { label: t('footerDashboard'), url: '/dashboard' },
      { label: t('footerContact'), url: '/contact' },
  ];

  return (
    <div className="min-h-screen w-full flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <section className="relative text-center py-24 px-4 sm:py-40 flex flex-col items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <Image
              src="https://picsum.photos/seed/herofootball/1800/1000"
              alt={t('heroAlt')}
              fill
              className="object-cover opacity-10"
              priority
              data-ai-hint="stadium lights football"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-transparent"></div>
          </div>
          <div className="relative z-10 max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold font-headline tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">
              {heroTitle}
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              {heroSubtitle}
            </p>
            <Button size="lg" onClick={scrollToMap} className="transition-transform duration-300 hover:scale-105">
              {t('exploreMap')}
              <ArrowDown className="ml-2 h-5 w-5 animate-bounce" />
            </Button>
          </div>
        </section>

        <section ref={mapRef} id="map-section" className="py-16 md:py-24 bg-muted/30">
          <div className="container mx-auto">
            <div className="flex justify-between items-center mb-6 px-4 md:px-0">
              <div className="flex items-center gap-2 p-1 rounded-lg bg-muted border">
                <Button
                  onClick={() => setViewMode('map')}
                  variant={viewMode === 'map' ? 'primary' : 'ghost'}
                  size="sm"
                  className="gap-2"
                >
                  <Map className="h-4 w-4" /> Carte
                </Button>
                <Button
                  onClick={() => setViewMode('table')}
                  variant={viewMode === 'table' ? 'primary' : 'ghost'}
                  size="sm"
                  className="gap-2"
                >
                  <List className="h-4 w-4" /> Liste
                </Button>
              </div>
              <p className="text-sm text-muted-foreground hidden md:block">
                {filteredFacilities.length} installations trouvées
              </p>
            </div>

            <div className="relative h-[85vh] rounded-xl overflow-hidden shadow-2xl border border-border/50">
                
                {/* Desktop Sidebar */}
                {!isMobile && (
                   <SidebarProvider>
                        <Sidebar collapsible="icon" variant="floating" className={cn("absolute top-4 left-4 z-20 w-80 max-h-[calc(100%-2rem)] bg-card/80 backdrop-blur-sm border-border/50 shadow-lg rounded-xl", viewMode === 'table' && "hidden")}>
                            <SidebarHeader className="flex items-center justify-between p-4 border-b border-border/50">
                                <h2 className="text-lg font-bold font-headline flex items-center gap-2"><SlidersHorizontal className="w-5 h-5"/> {t('filtersTitle')}</h2>
                                <Button onClick={handleLocateMe} variant="ghost" size="icon" className="h-8 w-8">
                                    <LocateFixed className="h-4 w-4" />
                                </Button>
                            </SidebarHeader>
                            <SidebarContent className="p-0 flex flex-col">
                                <Filters {...filterProps} />
                            </SidebarContent>
                        </Sidebar>
                    </SidebarProvider>
                )}
                
                {/* Mobile Filter Sheet Trigger */}
                {isMobile && (
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button className="absolute top-4 left-4 z-20 shadow-lg">
                                <Menu className="w-5 h-5 mr-2" />
                                {t('filtersTitle')}
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 flex flex-col">
                            <SheetHeader className="p-4 border-b">
                                <SheetTitle className="flex items-center gap-2">
                                  <SlidersHorizontal className="w-5 h-5"/>
                                  {t('filtersTitle')}
                                </SheetTitle>
                            </SheetHeader>
                            <Filters {...filterProps} />
                        </SheetContent>
                    </Sheet>
                )}

                {viewMode === 'map' && (
                  <Button onClick={handleLocateMe} variant="secondary" size="icon" className="absolute top-4 right-4 z-20 shadow-lg">
                    <LocateFixed className="h-5 w-5" />
                  </Button>
                )}
                    
                <div className="absolute inset-0 z-10 w-full h-full">
                    {facilitiesLoading ? (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <Skeleton className="w-full h-full" />
                      </div>
                    ) : viewMode === 'map' ? (
                      <HomeMapContainer 
                          facilities={filteredFacilities} 
                          center={mapCenter} 
                          zoom={mapZoom} 
                          onMarkerClick={handleMarkerClick}
                      />
                    ) : (
                      <ScrollArea className="h-full">
                        <FacilitiesTable facilities={filteredFacilities} onRowClick={handleMarkerClick} />
                      </ScrollArea>
                    )}
                </div>
            </div>
          </div>

          <Dialog open={!!selectedFacility} onOpenChange={(open) => !open && handleDialogClose()}>
              <DialogContent className="max-w-3xl p-0">
                  {selectedFacility && (
                      <>
                          <DialogHeader className="p-6 pb-4">
                              <DialogTitle className="font-headline text-3xl">{selectedFacility.name}</DialogTitle>
                              <DialogDescription>{selectedFacility.address}</DialogDescription>
                          </DialogHeader>
                          <ScrollArea className="max-h-[70vh] md:max-h-[80vh]">
                            <FacilityDetails facility={selectedFacility} />
                          </ScrollArea>
                      </>
                  )}
              </DialogContent>
          </Dialog>
        </section>
      </main>

      <footer className="bg-card border-t border-border/50">
        <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4 col-span-1 md:col-span-2">
              <h3 className="text-xl font-headline font-semibold flex items-center gap-2">
                <Activity className="text-primary"/>
                {appName}
              </h3>
              <p className="text-muted-foreground text-sm max-w-md">{footerDescription}</p>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-card-foreground/90">{t('footerNavigation')}</h4>
              <ul className="space-y-2 text-sm">
                 {footerLinks.map((link) => (
                    <li key={link.url}><InterceptedLink href={link.url} className="text-muted-foreground hover:text-primary transition-colors">{link.label}</InterceptedLink></li>
                ))}
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-card-foreground/90">{t('footerFollowUs')}</h4>
              <div className="flex space-x-4">
                <a href={settings?.facebookUrl || '#'} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors"><Facebook className="h-6 w-6" /></a>
                <a href={settings?.instagramUrl || '#'} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors"><Instagram className="h-6 w-6" /></a>
                <a href={settings?.twitterUrl || '#'} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors"><Twitter className="h-6 w-6" /></a>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border/50 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} {appName}. {t('footerRights')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
