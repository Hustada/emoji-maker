import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import crypto from 'crypto'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generates a deterministic UUID v4 from a string input
 * This is used to convert Clerk user IDs to Supabase-compatible UUIDs
 * @param str - The input string (typically a Clerk user ID)
 * @returns A UUID v4 format string
 */
export function generateUUIDFromString(str: string): string {
  // Create a deterministic UUID v4 based on the input string
  const hash = crypto.createHash('md5').update(str).digest('hex');
  
  // Format as UUID v4 (xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx)
  // Where y is one of: 8, 9, A, or B
  const uuid = [
    hash.substring(0, 8),
    hash.substring(8, 12),
    '4' + hash.substring(13, 16),
    '8' + hash.substring(17, 20), // UUID v4 variant
    hash.substring(20, 32)
  ].join('-');
  
  return uuid;
}
