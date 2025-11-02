import { Dumbbell, Activity, Bike, Cloudy, Goal, PersonStanding, Pin, Waves, Wind, Zap, Football, TennisBall, Volleyball, Weight } from 'lucide-react';

export const sportsIconsMap: Record<string, React.ElementType> = {
    "Football": Football,
    "Basketball": Activity,
    "Tennis": TennisBall,
    "Handball": Activity,
    "Volleyball": Volleyball,
    "Natation": Waves,
    "Athlétisme": PersonStanding,
    "Yoga": PersonStanding,
    "Musculation": Dumbbell,
    "CrossFit": Activity,
    "Padel": TennisBall,
};

export const equipmentIconsMap: Record<string, React.ElementType> = {
    "Haltères": Dumbbell,
    "Tapis de course": Activity,
    "Vélos elliptiques": Bike,
    "Balles de yoga": Pin,
    "Filets de volley-ball": Volleyball,
    "Paniers de basket": Activity,
    "Buts de football": Goal,
    "Raquettes de tennis": TennisBall,
    "Kettlebells": Weight,
    "Cages à squat": Dumbbell,
    "Bancs de musculation": Dumbbell,
    "Cordes à sauter": Activity,
    "Sacs de frappe": Activity,
};
