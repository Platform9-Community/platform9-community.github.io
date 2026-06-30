# Review Community Submissions

Fetch open GitHub Issues from the Platform9 Community repo, present each submission for approval, and publish approved projects to the site.

## Repo
`Platform9-Community/platform9-community.github.io`

## Steps

### 1. Fetch open issues
Run:
```bash
gh api repos/Platform9-Community/platform9-community.github.io/issues --jq '.[] | {number: .number, title: .title, body: .body, author: .user.login}'
```

If there are no open issues, tell the user there are no pending submissions and stop.

### 2. Present each submission
For each issue, parse the structured body and display:
- Name, Type, Description, GitHub URL, Category, Tags, Author, PCD Compatibility

Ask the user: **Approve, Skip, or Reject?**
- **Approve** → publish it (step 3)
- **Skip** → move to the next issue without closing it
- **Reject** → close the issue with a polite decline comment, move to next

### 3. Publish an approved submission

**a. Confirm or edit fields**
Before writing the file, confirm:
- Description looks complete and not truncated (max 150 chars for the card)
- Featured: ask if this should appear on the home page
- Icon: choose the best match from `/public/icons/` — available icons: `pcd.svg`, `kubernetes.svg`, `openstack.svg`, `terraform.svg`, `ansible.svg`, `helm.svg`, `prometheus.svg`, `vmware.svg`

**b. Create the project JSON**
Write to `src/data/projects/{slug}.json`:
```json
{
  "slug": "{slug}",
  "name": "{name}",
  "type": "{type}",
  "description": "{description}",
  "icon": "/icons/{best-match}.svg",
  "tags": ["{tag1}", "{tag2}"],
  "category": "{category-slug}",
  "stars": 0,
  "downloads": 0,
  "updatedAt": "{today-ISO}",
  "repoUrl": "{repoUrl}",
  "author": {
    "name": "{author}",
    "avatar": "https://github.com/{author}.png"
  },
  "featured": {true|false}
}
```

**c. Recalculate all counts from actual data — do not guess or increment manually**

Count projects per category:
```bash
for f in src/data/projects/*.json; do cat "$f"; done | grep '"category"' | sort | uniq -c
```

Count unique contributors:
```bash
for f in src/data/projects/*.json; do cat "$f"; done | grep '"name"' | grep -v 'Platform9' | sort -u | wc -l
```
(or read each JSON and collect unique `author.name` values)

Total project count:
```bash
ls src/data/projects/*.json | wc -l
```

Update `src/data/categories.json` — set each category's `projectCount` to the actual count from the files above.

Update `src/data/site.json`:
- `projectCount` = total project file count (as a string)
- `contributorCount` = unique author count (as a string)

**d. Build and verify**
```bash
npm run build
```
Must exit 0. If it fails, fix the issue before committing.

**e. Commit and push**
```bash
git add src/data/projects/{slug}.json src/data/categories.json src/data/site.json
git commit -m "Add {name} (approved from issue #{number})"
git push
```

**f. Close the issue**
```bash
gh issue comment {number} --repo Platform9-Community/platform9-community.github.io \
  --body "Approved and published. Live at https://platform9-community.github.io/projects/{slug}"
gh issue close {number} --repo Platform9-Community/platform9-community.github.io
```

### 4. Continue to the next issue
Repeat step 2–3 for all remaining open issues.

### 5. Summary
When all issues are processed, report:
- How many were approved, skipped, rejected
- Total project count now live
