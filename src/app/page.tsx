import { facilities } from "@/lib/data";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarInset,
} from "@/components/ui/sidebar";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import Header from "@/components/header";
import { ScrollArea } from "@/components/ui/scroll-area";
import HomeMap from "@/components/home-map";

const sports = [...new Set(facilities.flatMap(f => f.sports))];
const regions = [...new Set(facilities.map(f => f.region))];

export default function Home() {
  // In a real app, filters would be managed with state and would filter the `facilities` prop passed to MapView
  
  return (
    <div className="min-h-screen w-full flex flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <SidebarProvider>
          <Sidebar collapsible="icon" className="w-80">
            <SidebarHeader>
              <h2 className="text-xl font-bold font-headline">Filters</h2>
            </SidebarHeader>
            <Separator />
            <ScrollArea className="h-full">
              <SidebarContent>
                <SidebarGroup>
                  <SidebarGroupLabel>Sport</SidebarGroupLabel>
                  <SidebarGroupContent>
                    {sports.map(sport => (
                      <div key={sport} className="flex items-center space-x-2 my-2">
                        <Checkbox id={`sport-${sport}`} />
                        <Label htmlFor={`sport-${sport}`} className="font-normal">{sport}</Label>
                      </div>
                    ))}
                  </SidebarGroupContent>
                </SidebarGroup>
                <Separator />
                <SidebarGroup>
                  <SidebarGroupLabel>Region</SidebarGroupLabel>
                  <SidebarGroupContent>
                    {regions.map(region => (
                      <div key={region} className="flex items-center space-x-2 my-2">
                        <Checkbox id={`region-${region}`} />
                        <Label htmlFor={`region-${region}`} className="font-normal">{region}</Label>
                      </div>
                    ))}
                  </SidebarGroupContent>
                </SidebarGroup>
                <Separator />
                <SidebarGroup>
                  <SidebarGroupLabel>Other</SidebarGroupLabel>
                  <SidebarGroupContent>
                     <div className="flex items-center space-x-2 my-2">
                        <Checkbox id="type-indoor" />
                        <Label htmlFor="type-indoor" className="font-normal">Indoor</Label>
                      </div>
                      <div className="flex items-center space-x-2 my-2">
                        <Checkbox id="type-outdoor" />
                        <Label htmlFor="type-outdoor" className="font-normal">Outdoor</Label>
                      </div>
                      <div className="flex items-center space-x-2 my-2">
                        <Checkbox id="accessible" />
                        <Label htmlFor="accessible" className="font-normal">Accessible</Label>
                      </div>
                  </SidebarGroupContent>
                </SidebarGroup>
              </SidebarContent>
            </ScrollArea>
          </Sidebar>
          <SidebarInset className="p-0 overflow-hidden">
            <HomeMap facilities={facilities} />
          </SidebarInset>
        </SidebarProvider>
      </div>
    </div>
  );
}
