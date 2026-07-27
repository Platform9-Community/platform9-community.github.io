/**
 * Pulls open Dependabot alerts (known GHSA/CVE vulnerabilities in this repo's
 * own dependencies) and prints a severity-sorted report.
 *
 * Requires GITHUB_TOKEN with read access to the repo (Dependabot alerts are
 * not readable anonymously even on public repos).
 * Exits non-zero if any critical/high severity alert is open.
 */

const OWNER = 'Platform9-Community';
const REPO = 'platform9-community.github.io';
const SEVERITY_ORDER = ['critical', 'high', 'medium', 'low'];

if (!process.env.GITHUB_TOKEN) {
  console.error('GITHUB_TOKEN env var is required to read Dependabot alerts.');
  process.exit(1);
}

const headers = {
  'User-Agent': 'platform9-community-site',
  Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
  Accept: 'application/vnd.github+json',
};

async function fetchAllAlerts() {
  const alerts = [];
  let url = `https://api.github.com/repos/${OWNER}/${REPO}/dependabot/alerts?state=open&per_page=100`;

  while (url) {
    const res = await fetch(url, { headers });
    if (!res.ok) {
      console.error(`GitHub API ${res.status} for ${url}`);
      process.exit(1);
    }
    alerts.push(...(await res.json()));

    const link = res.headers.get('Link') || '';
    const next = link.split(',').find(part => part.includes('rel="next"'));
    url = next ? next.split(';')[0].trim().slice(1, -1) : null;
  }

  return alerts;
}

const alerts = await fetchAllAlerts();

if (alerts.length === 0) {
  console.log('No open Dependabot alerts.');
  process.exit(0);
}

const rows = alerts
  .map(alert => ({
    severity: alert.security_advisory.severity,
    package: alert.dependency.package.name,
    ghsa: alert.security_advisory.ghsa_id,
    manifest: alert.dependency.manifest_path,
    summary: alert.security_advisory.summary,
  }))
  .sort((a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity));

console.log(`${rows.length} open Dependabot alert(s):\n`);

for (const row of rows) {
  console.log(`${row.severity.toUpperCase().padEnd(8)} ${row.package.padEnd(12)} ${row.ghsa}`);
  console.log(`         ${row.summary} (${row.manifest})\n`);
}

const hasBlocking = rows.some(row => row.severity === 'critical' || row.severity === 'high');
process.exit(hasBlocking ? 1 : 0);
