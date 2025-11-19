/**
 * CN Utility - Combines Tailwind CSS classes intelligently
 * Uses clsx for conditional classes and tailwind-merge to avoid conflicts
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge Tailwind CSS classes
 * Handles conditional classes and resolves conflicts
 *
 * @example
 * cn('px-4 py-2', someCondition && 'bg-blue-500', 'text-white')
 * cn('px-4', 'px-8') // Returns 'px-8' (last class wins)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default cn;
