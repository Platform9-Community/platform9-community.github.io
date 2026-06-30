export interface Project {
  slug: string;
  name: string;
  type: 'project' | 'application';
  description: string;
  icon: string;
  tags: string[];
  category: string;
  stars: number;
  downloads: number;
  updatedAt: string;
  repoUrl: string;
  author: { name: string; avatar: string };
  featured: boolean;
  readme?: string;
}

export interface Category {
  slug: string;
  name: string;
  icon: string;
  color: string;
  projectCount: number;
}

export interface SiteStats {
  projectCount: string;
  contributorCount: string;
  downloadCount: string;
  downloadPeriod: string;
  countryCount: string;
}
