# CVMPOUND — Setup

A personal workout app for the CVMPOUND gym: browse equipment by photo, scan a
machine with your camera to recognize it, log weight / reps / sets with a rest
timer, track progress, and generate a free AI coaching program.

Stack: **Next.js 15 (App Router) · React 19 · TypeScript · Tailwind · Supabase ·
Claude API**.

## 1. Install

```bash
npm install
```

## 2. Supabase project

1. Create a new project at [supabase.com/dashboard](https://supabase.com/dashboard).
2. In the **SQL Editor**, run `supabase/schema.sql` (creates the tables + the
   public `equipment-photos` storage bucket).
3. Optionally run `supabase/seed.sql` to load a starter equipment catalog you
   can replace with real CVMPOUND machines + photos.
4. Settings → API → copy the **Project URL**, the **anon key**, and the
   **service role key**.

## 3. Environment variables

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # used by the API routes
ANTHROPIC_API_KEY=sk-ant-...                        # enables photo recognition + AI coach
CVMPOUND_API_KEY=                                   # optional; reserved for guarding writes
```

- Without `ANTHROPIC_API_KEY`, the app still works: **photo recognition** falls
  back to manual equipment selection, and the **coach** uses a built-in
  rule-based program generator (`source: "fallback"`).

## 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## 5. Add your equipment

Go to **Manage** (`/equipment`) → **Add** → enter a name, category, and snap or
upload a photo. The photo is stored in the `equipment-photos` bucket and shown
on the home grid. Recognition and the coach both work off whatever equipment you
add here.

## 6. Deploy (Vercel)

```bash
npx vercel --prod
```

Add the same environment variables in the Vercel project settings.

## App map

| Route          | What it does                                          |
| -------------- | ----------------------------------------------------- |
| `/`            | Equipment grid — tap a machine to log                 |
| `/log/[slug]`  | Log weight / reps / sets + rest timer for one machine |
| `/recognize`   | Camera/upload → Claude vision → opens that machine    |
| `/session`     | Current workout summary → finish                      |
| `/history`     | Past workouts + per-exercise strength charts          |
| `/coach`       | Set a goal → free AI program (Claude or fallback)     |
| `/equipment`   | Add / edit equipment with photos                      |

## API routes

- `POST /api/recognize` — `{ image: base64, mediaType }` → `{ matched, equipment?, confidence? }`
- `POST /api/coach` — `{ goalType, experience, daysPerWeek, notes? }` → `{ program, days, source }`

Both use `claude-opus-4-8` and degrade gracefully when `ANTHROPIC_API_KEY` is unset.
