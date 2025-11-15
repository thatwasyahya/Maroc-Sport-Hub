import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getLocalized(value: string | Record<string, string> | undefined, locale: string, fallback?: string) {
  if (!value) return fallback ?? '';
  if (typeof value === 'string') return value;
  return (value as Record<string, string>)[locale] ?? Object.values(value)[0] ?? fallback ?? '';
}
