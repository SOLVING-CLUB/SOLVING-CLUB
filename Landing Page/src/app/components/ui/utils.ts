import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Smoothly scrolls to an element by its ID
 * @param id - The ID of the element to scroll to (without the #)
 * @param offset - Optional offset in pixels (default: 80 for header height)
 */
export function scrollToSection(id: string, offset: number = 80) {
  const element = document.getElementById(id);
  if (element) {
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - offset;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'auto'
    });
  }
}

/**
 * Handles click events for anchor links with smooth scrolling
 * @param e - Mouse event
 * @param href - The href value (e.g., "#services")
 */
export function handleAnchorClick(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
  if (href.startsWith('#')) {
    e.preventDefault();
    const id = href.substring(1);
    scrollToSection(id);
  }
}
