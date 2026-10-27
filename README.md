# AgriSmart (local demo)

A smart-farm web app: farms, crops, soil guidance, crop advisor, pest guide, reminders, simulated weather, sample marketplace, community posts and consultation requests.

* **Frontend:** React + Vite (JavaScript, plain responsive CSS)
* **Backend:** Node.js + Express REST API, bcrypt password hashing, JWT in an HttpOnly cookie
* **Storage:** local JSON files in `server/data/` by default (**not MongoDB**), or **MongoDB** when `MONGODB_URI` is set in `server/.env` (see "Using MongoDB"). All storage goes through `server/src/storage/jsonStore.js`, so MongoDB can replace it later without changing the frontend.

## 1. Install Node.js (once)

1. Download the **LTS** installer from https://nodejs.org and run it (keep "Add to PATH" ticked).
2. **Close VS Code completely and open it again.**
3. In VS Code open the terminal (`` Ctrl+` ``) and check:
   ```
   node -v
   npm -v
   ```
   Node must be **20.12 or newer**.

## 2. Run the project

1. In VS Code: **File → Open Folder…** and choose the folder that contains this `README.md` (the one with `client`, `server` and `package.json`).
2. Open the terminal and run:
   ```
   npm start
   ```
   The first run installs the packages and builds the website (a few minutes, needs internet). Later runs start in seconds.
3. Open **http://localhost:5000** in your browser.
4. Stop the server with `Ctrl+C`.

## 3. Sign in

* **Register** a new account on the Register page, **or**
* use the demo account created automatically on the first run: `demo@agrismart.local` / `Demo@12345` (the Log in page has a "Fill demo login" button). It does not exist if you disabled it with `SEED_DEMO=false` or if the users file was reset and the server not restarted.

## Useful commands (run from the project root)

| Command | What it does |
|---|---|
| `npm start` | Install (first time), build (when needed), start the server |
| `npm run dev` | Development mode with hot reload at http://localhost:5173 |
| `npm test` | Run server and client tests |
| `npm run reset-data` | Delete all local demo data (users, farms, …). Restart afterwards to get fresh sample data |

## Using MongoDB (optional)

1. Create a free cluster at https://www.mongodb.com/atlas (or install MongoDB Community locally).
2. Atlas: create a database user (use a password without special characters), under *Network Access* allow your IP (for a class demo, "Allow access from anywhere"), then *Connect → Drivers* and copy the connection string. Add the database name, e.g. `...mongodb.net/agrismart?retryWrites=true&w=majority`.
3. Create the file `server/.env` and add one line: `MONGODB_URI=your-connection-string`
4. Run `npm start`. The terminal must say **Storage: MongoDB**. Remove the line to go back to JSON files.
Data is then stored in the `agrismart` database; `npm run reset-data` only clears the JSON files, so to clear MongoDB drop the database in Atlas.

## What is real and what is simulated

* Your farms, crops, soil readings, reminders, posts: real data you enter, stored in `server/data/`.
* **Weather: simulated** and labelled. No API key or internet is needed.
* **Soil advice and crop advisor:** simple documented rules (`server/src/services/soilRules.js`, `cropRecommender.js`). Educational only. No AI model, no fertilizer doses.
* **Pest guide:** educational information, not a diagnosis, and no pesticide products or doses.
* **Marketplace products and orders, expert consultations:** simulated. No payment, no delivery, no expert reply.

## Security notes

Passwords hashed with bcrypt; login via signed JWT in an HttpOnly, SameSite=Lax cookie; every private record is checked against its owner on the server; users cannot choose a role (everyone is a "farmer"; there is no admin); input validated server-side; failed login attempts rate-limited; Helmet security headers; a custom header is required on state-changing requests (CSRF defence).
Limitations: designed for local use over http://localhost. For a public deployment you would need HTTPS, a real database, a managed secret, and more hardening (email verification, password reset, audit logging).

## Troubleshooting

* **`'npm' is not recognized`** → install Node.js (step 1), then fully close and reopen VS Code.
* **PowerShell says "running scripts is disabled"** → run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` in PowerShell, or switch the VS Code terminal to *Command Prompt* (dropdown next to the + button).
* **`npm install` fails or hangs** → check internet/VPN/proxy; try `npm config set registry https://registry.npmjs.org/` and run `npm start` again.
* **"Port 5000 is already in use"** → close the other program, or create `server/.env` containing `PORT=5001` and open http://localhost:5001.
* **Blank page / "frontend is not built"** → run `npm run build`, then `npm start`.
* **Want a clean slate** → `npm run reset-data`, then `npm start`.
* **Node too old** → install the current LTS from https://nodejs.org.

## Project layout

```
client/   React app (src/pages, src/components, src/services/api.js)
server/   Express API (src/routes/api.js, src/services = business rules, src/storage = JSON store)
scripts/  run.js launcher used by npm start
```
