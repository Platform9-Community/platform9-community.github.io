import type { APIRoute } from 'astro';
import { getAllProjects } from '../lib/data';

export const GET: APIRoute = () => {
  const projects = getAllProjects().map(({ slug, name, type, description, tags, category }) => ({
    slug,
    name,
    type,
    description,
    tags,
    category,
  }));
  return new Response(JSON.stringify(projects), {
    headers: { 'Content-Type': 'application/json' },
  });
};
