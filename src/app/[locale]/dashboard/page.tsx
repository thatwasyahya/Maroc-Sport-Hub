'use client';

import { useMemo } from 'react';
import type { Facility, User, FacilityRequest } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, Users, FileText, Loader2, ListOrdered, BarChart3, PieChartIcon, Trophy } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslations } from 'next-intl';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Pie, PieChart, Cell, LabelList } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { defaultData } from '@/lib/data';
import { useState } from 'react';

function DashboardSkeleton() {
  const t = useTranslations('Dashboard.Overview');
  return (
    <div className="grid gap-6">
      <Skeleton className="h-8 w-1/2" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-12" />
              <Skeleton className="h-4 w-48 mt-1" />
            </CardContent>
          </Card>
        ))}
      </div>
       <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const t = useTranslations('Dashboard.Overview');

  // Using local data ONLY to avoid any Firestore permission errors.
  const [facilities, setFacilities] = useState<Facility[]>(defaultData.facilities);
  const [users, setUsers] = useState<User[]>(defaultData.users);
  // Simulating pending requests from local data for display purposes.
  const [pendingRequests, setPendingRequests] = useState<FacilityRequest[]>([]); 
  const [isLoading, setIsLoading] = useState(false);


  const stats = useMemo(() => {
    return {
      totalFacilities: facilities?.length ?? 0,
      totalUsers: users?.length ?? 0,
      // The number of pending requests will be 0 as we are not fetching them.
      pendingRequests: pendingRequests?.length ?? 0,
    };
  }, [facilities, users, pendingRequests]);
  
  const facilitiesByRegion = useMemo(() => {
    if (!facilities) return [];
    const counts = facilities.reduce((acc, facility) => {
        if (facility.region) {
            acc[facility.region] = (acc[facility.region] || 0) + 1;
        }
        return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts).map(([region, count]) => ({ region, count })).sort((a,b) => b.count - a.count);
  }, [facilities]);
  
  const facilitiesByState = useMemo(() => {
    if (!facilities) return [];
    const counts = facilities.reduce((acc, facility) => {
        const state = facility.establishment_state || 'Non défini';
        acc[state] = (acc[state] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts).map(([name, value]) => ({ name, value, fill: `hsl(var(--chart-${Object.keys(counts).indexOf(name) + 1}))` }));
  }, [facilities]);

  const topSports = useMemo(() => {
    if (!facilities) return [];
    const sportCounts = facilities.flatMap(f => f.sports || []).reduce((acc, sport) => {
        acc[sport] = (acc[sport] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    return Object.entries(sportCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
  }, [facilities]);
  
  const chartConfig: ChartConfig = {
    count: { label: t('facilityCount'), color: "hsl(var(--chart-1))" },
    region: { label: t('region') },
  };

  const topSportsChartConfig: ChartConfig = {
      count: { label: t('facilityCount'), color: "hsl(var(--chart-2))" },
  }

  const pieChartConfig = useMemo(() => {
    if (!facilitiesByState) return {}
    return facilitiesByState.reduce((acc, item, index) => {
        acc[item.name] = {
            label: item.name,
            color: `hsl(var(--chart-${index + 1}))`
        }
        return acc;
    }, {} as ChartConfig);
  }, [facilitiesByState]);


  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="grid gap-8">
      <h1 className="text-3xl font-bold">{t('title')}</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalFacilities')}</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFacilities}</div>
            <p className="text-xs text-muted-foreground">{t('totalFacilitiesDescription')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalUsers')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">{t('totalUsersDescription')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('pendingRequests')}</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingRequests}</div>
            <p className="text-xs text-muted-foreground">{t('pendingRequestsDescription')}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-3">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><BarChart3/> {t('facilitiesByRegionTitle')}</CardTitle>
                <CardDescription>{t('facilitiesByRegionDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="min-h-64 w-full">
                    <BarChart data={facilitiesByRegion} accessibilityLayer>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="region" tickLine={false} tickMargin={10} axisLine={false} tickFormatter={(value) => value.slice(0, 3)} />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="count" fill="var(--color-count)" radius={4} />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><PieChartIcon/> {t('facilitiesByStateTitle')}</CardTitle>
                <CardDescription>{t('facilitiesByStateDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
                 <ChartContainer config={pieChartConfig} className="min-h-64 w-full">
                    <PieChart>
                         <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                         <Pie data={facilitiesByState} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} labelLine={false} label={({
                            cx,
                            cy,
                            midAngle,
                            innerRadius,
                            outerRadius,
                            value,
                            index,
                          }) => {
                            const RADIAN = Math.PI / 180
                            const radius = 12 + innerRadius + (outerRadius - innerRadius)
                            const x = cx + radius * Math.cos(-midAngle * RADIAN)
                            const y = cy + radius * Math.sin(-midAngle * RADIAN)
                 
                            return (
                              <text
                                x={x}
                                y={y}
                                className="fill-muted-foreground text-xs"
                                textAnchor={x > cx ? "start" : "end"}
                                dominantBaseline="central"
                              >
                                {facilitiesByState[index].name} ({value})
                              </text>
                            )
                          }}>
                             {facilitiesByState.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                         </Pie>
                    </PieChart>
                 </ChartContainer>
            </CardContent>
        </Card>
      </div>

       <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Trophy />{t('topSportsTitle')}</CardTitle>
          <CardDescription>{t('topSportsDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
            <ChartContainer config={topSportsChartConfig} className="min-h-64 w-full">
                <BarChart data={topSports} layout="vertical" accessibilityLayer>
                    <CartesianGrid horizontal={false} />
                    <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tickMargin={10} width={100} />
                    <XAxis dataKey="count" type="number" hide />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                    <Bar dataKey="count" fill="var(--color-count)" radius={5}>
                        <LabelList dataKey="count" position="right" offset={8} className="fill-foreground text-sm" />
                    </Bar>
                </BarChart>
            </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
