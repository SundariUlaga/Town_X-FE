# Town Exchange — Frontend Setup Guide

This is the frontend app for Town Exchange. It is built with React and Vite.

Follow every step below in order on a new computer.

---

## Before you start — install these first

1. **Node.js 18 or higher** (20+ recommended)  
   Download: https://nodejs.org/

2. **Git**  
   Download: https://git-scm.com/

Check Node is installed:

```bash
node --version
```

You should see something like `v18.x.x` or higher.

---

## Step 1: Get the project on your computer

Open a terminal and run:

```bash
git clone <your-frontend-repo-url>
cd Town_X-FE/my-app
```

You are in the right folder if you can see:
- `package.json`
- `vite.config.js`
- `src/` folder
- `.env.example`

---

## Step 2: Install npm packages

Run:

```bash
npm install
```

Wait until it finishes with no errors. This creates a `node_modules` folder.

---

## Step 3: Create the `.env` file

The frontend needs to know the API URL it should connect to. That URL goes in a `.env` file.

### 3.1 — Create the file

**Easiest way:** copy the example file.

On Windows:

```powershell
copy .env.example .env
```

On macOS / Linux:

```bash
cp .env.example .env
```

**Or create it yourself:**
1. Open the `Town_X-FE/my-app` folder in VS Code / Cursor
2. Right-click → New File
3. Name it exactly: `.env`  
   (Not `.env.txt` — just `.env`)

### 3.2 — Open `.env` and add this line

For local development:

```env
VITE_API_URL=http://localhost:8024
```

### 3.3 — Change the URL if needed

If your API runs on a different address, update the value:

```env
VITE_API_URL=http://localhost:8024
```

For production:

```env
VITE_API_URL=https://api.yourdomain.com
```

**What this line means:**

- `VITE_API_URL` — the API address this app will call  
  If you skip this file, it defaults to `http://localhost:8024`

**Rules:**
- Must start with `VITE_` (Vite only reads variables with this prefix)
- No quotes around the URL
- No spaces before or after `=`
- Do not commit this file to Git
- After changing `.env`, restart the dev server

Save the file.

---

## Step 4: Start the frontend

In the `Town_X-FE/my-app` folder, run:

```bash
npm run dev
```

You should see something like:

```
  VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5188/
```

**Keep this terminal open.**

---

## Step 5: Open the app and check it works

1. Open http://localhost:5188 in your browser
2. The landing page should load
3. Press **F12** to open DevTools → go to the **Network** tab
4. Refresh the page
5. Look for a request to `landing-config` — it should succeed (status 200)

If the page loads and that request works, your frontend setup is complete.

**If the page loads but data is missing:**
- Check `VITE_API_URL` in `.env` is correct
- Stop the dev server (`Ctrl+C`) and run `npm run dev` again

---

## Next time you work on the frontend

Every new terminal session:

```bash
cd Town_X-FE/my-app
npm run dev
```

---

## Other useful commands

```bash
npm run dev       # Start dev server (http://localhost:5188)
npm run build     # Build for production → creates dist/ folder
npm run preview   # Preview the production build locally
npm run lint      # Check code with ESLint
```

### Building for production

Set the API URL **before** building:

1. Put your production URL in `.env`:
   ```env
   VITE_API_URL=https://api.yourdomain.com
   ```
2. Run:
   ```bash
   npm run build
   npm run preview
   ```

The build embeds `VITE_API_URL` at build time — changing `.env` after `npm run build` has no effect until you rebuild.

---

## If something goes wrong

**`npm install` fails**  
→ Use Node 18+. Delete `node_modules` folder and run `npm install` again.

**Blank page or no data**  
→ Check `VITE_API_URL` in `.env` points to the correct API address.

**Changed `.env` but nothing changed**  
→ Stop the dev server (`Ctrl+C`) and run `npm run dev` again.

**Port 5188 already in use**  
→ Run on another port: `npm run dev -- --port 5176`

---

## Project folders

```
my-app/
├── src/
│   ├── components/     ← pages (PropertyFeed, Favourites, etc.)
│   ├── services/       ← API calls (api.js, configAPI.js)
│   ├── shared/         ← reusable UI parts
│   ├── App.jsx         ← routes
│   └── main.jsx        ← app entry
├── .env                ← you create this (not in Git)
├── .env.example        ← copy this to create .env
├── package.json
└── vite.config.js
```

---

## App pages (routes)

- `/` — landing page
- `/property-feed` — browse properties
- `/property/:id` — property details
- `/favourites` — saved properties
- `/story/:id` — view a story

---

## Tech stack

React 18 · Vite 7 · Tailwind CSS 4 · Chakra UI · React Router 7 · Axios · GSAP · Framer Motion
