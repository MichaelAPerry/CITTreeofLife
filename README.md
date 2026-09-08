# Computing Tree of Life — Career Explorer

An interactive, evolutionary "Tree of Life" for computing and IT careers. Built as a research companion for high school students completing a career research paper based on BLS.gov (Occupational Outlook Handbook) and O\*NET Online data.

## Running it locally

```bash
npm install
npm run dev
```

Then open the printed local URL (usually http://localhost:5173).

To build a static production bundle (deployable to any static host — GitHub Pages, Netlify, a school server, etc.):

```bash
npm run build
```

The output goes to `dist/`.

## How it works

- **`src/data/careers.json`** — the entire career tree. Every domain, specialization, established career, and emerging career is one entry in this file. **This is the file teachers edit** to correct data, add new roles, or plug in real YouTube video IDs — no code changes required.
- **`src/lib/tree.ts`** — turns the flat JSON list into the parent/child tree structure the visualization renders.
- **`src/components/TreeView.tsx`** — the D3.js pan/zoom/click tree visualization.
- **`src/components/DetailDrawer.tsx`** — the worksheet-style detail panel that opens when a node is clicked.
- Student answers (skills checklist, interview notes, reflection, local availability, main/related career picks) are saved automatically to the browser's `localStorage` — nothing is sent to a server, and nothing is lost between visits on the same device/browser.

## Editing `careers.json`

Each entry looks like this:

```json
{
  "id": "data-scientist",
  "name": "Data Scientist",
  "type": "career",
  "parentId": "data-science-ml",
  "tagline": "Builds statistical models to predict and explain",
  "description": "...",
  "tasks": ["...", "..."],
  "education": { "typicalEntry": "...", "degrees": ["..."], "certifications": ["..."] },
  "salary": { "median": 112590, "range": "$75,000 – $165,000", "period": "annual", "benefits": ["..."] },
  "availability": { "nationalGrowthPct": 36, "nationalGrowthLabel": "...", "annualOpenings": 20800, "projectionWindow": "2023–2033", "localNote": "" },
  "videoSearchQuery": "day in the life of a data scientist",
  "videos": [{ "title": "Real interview title", "youtubeId": "dQw4w9WgXcQ" }],
  "skills": [{ "name": "Python or R", "category": "technical" }],
  "sources": { "bls": "https://www.bls.gov/ooh/...", "onet": "https://www.onetonline.org/link/summary/...", "fallbackNote": null }
}
```

Field notes:

- **`type`** is one of `root` (the single trunk node), `domain`, `specialization`, `career`, or `emerging`. Only `career` and `emerging` nodes can be set as a student's Main/Related career and show the full worksheet; `root`/`domain`/`specialization` nodes show a lighter "about this branch" panel with links to their children.
- **`parentId`** must match another node's `id` — this is what draws the branch. Set it to `null` only for the root node.
- **`videos`** — add real `{ title, youtubeId }` entries here once you've found good interview/"day in the life" videos; students can still search and paste their own if this stays empty. `youtubeId` is the 11-character code from a YouTube URL (`youtube.com/watch?v=`**`dQw4w9WgXcQ`**).
- **`sources.fallbackNote`** — use this for brand-new/emerging roles that don't have their own BLS or O\*NET listing yet, to explain the closest official match.
- To add a brand-new emerging career, copy an existing `career`/`emerging` entry, give it a unique `id`, set `type: "emerging"`, and point `parentId` at whichever existing node it branches from.

No build step is required to see data edits — just save the file and refresh (or let `npm run dev` hot-reload it).

## Data accuracy

Salary, growth, and openings figures are approximate starting points for research, written from general knowledge of BLS/O\*NET data and clearly labeled as such in the app. Students are pointed to the live BLS and O\*NET links on every career panel to confirm current national numbers and to look up state/local figures, which this app does not fetch automatically.
