# Project status

## Done (source code written)
* Backend: auth (register/login/logout/me), profile + password change, farms, crops, soil analyses (+compare), crop advisor, pest guide + symptom matcher, alerts + reminders, simulated weather, dashboard, sample marketplace + simulated orders, community posts, consultation requests.
* Frontend: landing, about/privacy, login, register, dashboard, farms, crops, soil, advisor, alerts/reminders/pest guide, weather, marketplace, community, profile; shared CRUD page, toasts, confirm dialogs, responsive CSS.
* JSON-file storage with atomic writes; automatic sample data + demo account on first run.

## Tests actually run (in the build sandbox, which had NO internet)
* Server unit tests (`node --test`): 30 passed. They cover validation, soil rules, crop recommender, weather advice, pest library, JSON storage persistence/corruption recovery, auth service (password never stored in plain text, role cannot be chosen), farm CRUD, crop CRUD, ownership isolation, alerts, seeding.
* Client formatter test: 1 passed.
* Syntax check of every server and client file: no errors (server via `node --check`, client JSX via esbuild).

## NOT run (could not be, because the sandbox could not download npm packages)
* `npm install`, the Vite production build, and starting the real Express server.
* `server/tests/api.test.js` (end-to-end HTTP tests: auth, cookies, CSRF header, ownership over HTTP). Written but skipped here; it runs automatically after `npm install` via `npm test`.
* Any browser test of the real interface. The UI has therefore never been rendered in this sandbox.
* `start-windows.bat` was deliberately not created (it could not be verified).
* The final ZIP could not be re-extracted, installed and started.

## Known issues / limitations
* Expect possible first-run bugs in the untested layers (Express wiring, UI). Run `npm test`, then `npm start`, and report any error text.
* Not multilingual yet. Weather is simulated only. No admin role. Email can't be changed. No password reset.

## MongoDB
* `server/src/storage/mongoStore.js` added (same interface as the JSON store, chosen by MONGODB_URI). **Untested**: the sandbox has no internet or MongoDB, so it was only syntax-checked.

## Next action
1. Install Node.js LTS, open the folder in VS Code, run `npm start`, open http://localhost:5000.
2. Run `npm test` and confirm the API test passes.
3. Later: swap `jsonStore.js` for MongoDB; add a real weather provider.
