import type { Project, Category, SiteStats } from '../types/index';
import categoriesData from '../data/categories.json';
import siteData from '../data/site.json';

const projectModules = import.meta.glob('../data/projects/*.json', { eager: true });

export function getAllProjects(): Project[] {
  return Object.values(projectModules).map((mod: any) => (mod.default ?? mod) as Project);
}

export function getFeaturedProjects(): Project[] {
  return getAllProjects().filter(p => p.featured);
}

export function getProjectBySlug(slug: string): Project | undefined {
  return getAllProjects().find(p => p.slug === slug);
}

export function getProjectsByCategory(categorySlug: string): Project[] {
  return getAllProjects().filter(p => p.category === categorySlug);
}

export function getApplications(): Project[] {
  return getAllProjects().filter(p => p.type === 'application');
}

export function getAllCategories(): Category[] {
  return categoriesData as Category[];
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return getAllCategories().find(c => c.slug === slug);
}

export function getSiteStats(): SiteStats {
  return siteData as SiteStats;
}

export function relativeTime(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const days = Math.floor(diffMs / 86_400_000);
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 7) return `${days} days ago`;
  if (days < 14) return '1 week ago';
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 60) return '1 month ago';
  return `${Math.floor(days / 30)} months ago`;
}

export function formatDownloads(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
  return String(n);
}
