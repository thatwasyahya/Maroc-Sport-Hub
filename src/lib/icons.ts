import { Dumbbell, Activity, Bike, Goal, PersonStanding, Pin, Waves, Weight } from 'lucide-react';

export const sportsIconsMap: Record<string, React.ElementType> = {
    "Football": Goal,
    "Basketball": Activity,
    "Tennis": Activity,
    "Handball": Activity,
    "Volleyball": Activity, // Remplacé par Activity pour corriger l'erreur de build
    "Natation": Waves,
    "Athlétisme": PersonStanding,
    "Yoga": PersonStanding,
    "Musculation": Dumbbell,
    "CrossFit": Activity,
    "Padel": Activity,
};

export const equipmentIconsMap: Record<string, React.ElementType> = {
    "Haltères": Dumbbell,
    "Tapis de course": Activity,
    "Vélos elliptiques": Bike,
    "Balles de yoga": Pin,
    "Filets de volley-ball": Activity, // Remplacé par Activity
    "Paniers de basket": Activity,
    "Buts de football": Goal,
    "Raquettes de tennis": Activity,
    "Kettlebells": Weight,
    "Cages à squat": Dumbbell,
    "Bancs de musculation": Dumbbell,
    "Cordes à sauter": Activity,
    "Sacs de frappe": Activity,
};
