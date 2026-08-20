/**
 * Fetches GitHub star and release-download counts for each project and
 * updates the stars/downloads fields in src/data/projects/*.json.
 *
 * Run before `npm run build`. Uses GITHUB_TOKEN if set (higher rate limit).
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectsDir = join(__dirname, '../src/data/projects');

const headers = { 'User-Agent': 'platform9-community-site' };
if (process.env.GITHUB_TOKEN) {
  headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
}

function parseRepo(repoUrl) {
  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/?#]+)/);
  if (!match) return null;
  const [, owner, repoRaw] = match;
  return { owner, repo: repoRaw.replace(/\.git$/, '') };
}

async function getGitHubStars(owner, repo) {
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
    if (!res.ok) {
      console.warn(`  GitHub API ${res.status} for ${owner}/${repo} (stars) — skipping`);
      return null;
    }
    const data = await res.json();
    return data.stargazers_count ?? null;
  } catch (err) {
    console.warn(`  Error fetching stars for ${owner}/${repo}: ${err.message} — skipping`);
    return null;
  }
}

async function getGitHubDownloads(owner, repo) {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/releases`,
      { headers }
    );
    if (!res.ok) {
      console.warn(`  GitHub API ${res.status} for ${owner}/${repo} (releases) — skipping`);
      return null;
    }
    const releases = await res.json();
    return releases.reduce(
      (total, release) =>
        total + release.assets.reduce((sum, asset) => sum + asset.download_count, 0),
      0
    );
  } catch (err) {
    console.warn(`  Error fetching releases for ${owner}/${repo}: ${err.message} — skipping`);
    return null;
  }
}

const files = readdirSync(projectsDir).filter(f => f.endsWith('.json'));
let updated = 0;

console.log(`Updating star/download counts for ${files.length} project(s)...`);

for (const file of files) {
  const filePath = join(projectsDir, file);
  const project = JSON.parse(readFileSync(filePath, 'utf-8'));

  if (!project.repoUrl) continue;
  const parsed = parseRepo(project.repoUrl);
  if (!parsed) continue;
  const { owner, repo } = parsed;

  const [stars, downloads] = await Promise.all([
    getGitHubStars(owner, repo),
    getGitHubDownloads(owner, repo),
  ]);

  let changed = false;
  if (stars !== null && stars !== project.stars) {
    project.stars = stars;
    changed = true;
  }
  if (downloads !== null && downloads !== project.downloads) {
    project.downloads = downloads;
    changed = true;
  }

  if (changed) {
    writeFileSync(filePath, JSON.stringify(project, null, 2) + '\n');
    console.log(`  ✓ ${project.name}: ${project.stars} stars, ${project.downloads} downloads`);
    updated++;
  }
}

console.log(`Done. ${updated} project(s) updated.`);
