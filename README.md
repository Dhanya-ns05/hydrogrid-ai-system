# hydrogrid-ai-system

## Live backend

The repository includes a Node backend at `/api/live-data`. It accepts JSON latitude/longitude,
fetches Open-Meteo weather/rainfall and OpenStreetMap region data, and returns a location-specific
risk score. Run the two processes in separate terminals:

```bash
npm run dev:backend
npm run dev
```

Vite proxies `/api` to `http://localhost:8787`. For a deployed backend, set
`VITE_BACKEND_API_URL` to its public `/api/live-data` URL using `.env` (see `.env.example`).
If an upstream provider fails or times out, the backend returns HTTP 503 and the frontend shows
`Live data unavailable`; it does not generate replacement live values.


