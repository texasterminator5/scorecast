# Scoreboard Overlay for Streamlabs (iOS)

A simple, transparent scoreboard overlay you can use as a **custom URL layer** in the Streamlabs Mobile app on iOS.

## What’s included

- **`index.html`** – The overlay (Team 1 vs Team 2, scores, optional period). Designed for 16:9 (1920×1080), transparent background.
- **`control.html`** – Control page to set team names, scores, and period, then get the overlay URL to paste into Streamlabs.

## Using it with Streamlabs on iOS

1. **Host the overlay**  
   Put these files on a public URL (e.g. GitHub Pages, Netlify, or your own server). See [Hosting](#hosting) below.

2. **In Streamlabs Mobile (iOS):**
   - Open the app → **menu (☰)** → **Scenes** → create or edit a scene.
   - Tap **Layers** (top right) → **+** (Add layer).
   - Choose **Custom item** → **URL** (or “Link to a website”).
   - Paste the **overlay URL** (from the control page).  
     Example:  
     `https://your-site.com/scoreboard-overlay/index.html?team1=Red&team2=Blue&s1=5&s2=3`

3. **Position the layer**  
   Resize and move the URL layer in the editor. Stream output is 16:9; edit in landscape so it matches what viewers see.

4. **Updating scores**  
   - **Live update (recommended):** Turn on “Live update” on the control page and set up Firebase (see [Live update with Firebase](#live-update-with-firebase)). Use one overlay URL in Streamlabs; the overlay refreshes every 2 seconds when you change scores on the control page.  
   - **URL params only:** Change team names/scores on the control page, then **Copy overlay URL** and paste it into the Streamlabs layer (replace the old URL).

## Live update with Firebase

To have the overlay **auto-update** when you change scores (no pasting a new URL each time):

1. **Create a Firebase project** (free):  
   Go to [Firebase Console](https://console.firebase.google.com/) → **Add project** → follow the steps.

2. **Enable Realtime Database:**  
   In the project, go to **Build** → **Realtime Database** → **Create Database**. Choose a location, then start in **test mode** (read/write allowed for 30 days) or set [rules](https://firebase.google.com/docs/database/security) like:
   ```json
   {
     "rules": {
       "rooms": {
         ".read": true,
         ".write": true
       }
     }
   }
   ```

3. **Copy the Database URL:**  
   On the Realtime Database page, copy the URL at the top (e.g. `https://your-project-default-rtdb.firebaseio.com`). Do **not** add `/rooms` or `.json` — use only the base URL.

4. **On the control page:**  
   - Check **Live update (overlay auto-updates)**.  
   - Paste the **Firebase Database URL** into the field.  
   - Use the **Room ID** shown (or type your own, e.g. `pool-match-1`).  
   - Click **Copy overlay URL** and paste that **single URL** into Streamlabs. You only need to do this once.

5. **Use the overlay:**  
   When you change team names or scores on the control page, the overlay in Streamlabs updates within about 2 seconds. No need to copy or paste a new URL.

## Overlay URL parameters

You can build the overlay URL yourself. All parameters are optional.

| Parameter | Description | Example |
|-----------|-------------|--------|
| `team1`  | Team 1 name | `team1=Red%20Squad` |
| `team2`  | Team 2 name | `team2=Blue%20Squad` |
| `s1`     | Team 1 score | `s1=10` |
| `s2`     | Team 2 score | `s2=8` |
| `raceTo1` | Race to (Team 1) | `raceTo1=13` |
| `raceTo2` | Race to (Team 2) | `raceTo2=13` |

For **live update**, the overlay URL uses `room` and `db` instead:  
`index.html?room=YOUR_ROOM_ID&db=FIREBASE_DATABASE_URL`  
(Use the control page to generate this URL after enabling Live update.)

## Hosting

The overlay must be loaded from a **public URL** so Streamlabs Mobile can fetch it.

### Option A: GitHub Pages

1. Create a repo, push `index.html` and `control.html` into it.
2. Repo **Settings** → **Pages** → Source: **Deploy from branch** → branch `main` (or `master`), folder **/ (root)**.
3. Your overlay URL will be:  
   `https://<username>.github.io/<repo-name>/index.html`  
   Control page:  
   `https://<username>.github.io/<repo-name>/control.html`

### Option B: Netlify

1. Sign up at [netlify.com](https://www.netlify.com).
2. Drag the folder containing `index.html` and `control.html` into the Netlify deploy area, or connect a Git repo.
3. Use the provided URL, e.g.  
   `https://your-site.netlify.app/index.html`  
   and  
   `https://your-site.netlify.app/control.html`.

### Option C: Host from an always-on machine

You can serve the overlay from a PC or NAS that’s always on. Streamlabs on your phone must be able to reach it over the internet (see below).

**1. Run a simple web server on that machine**

- **Windows (Python):**  
  Open a command prompt in the `scoreboard-overlay` folder and run:
  ```bash
  python -m http.server 8080
  ```
  Or double‑click **`serve.bat`** (serves on port 8080).

- **Windows (PowerShell, no Python):**
  ```powershell
  cd path\to\scoreboard-overlay
  npx -y serve -p 8080
  ```
  (Requires Node.js.)

- **Mac/Linux:**
  ```bash
  cd scoreboard-overlay
  python3 -m http.server 8080
  ```

Then on the same machine, open:  
`http://localhost:8080/control.html` to get overlay URLs.

**2. Make it reachable from the internet**

Your phone (and Streamlabs) need a **public URL** that points to this server. Two options:

| Approach | Pros | Cons |
|----------|------|------|
| **Tunnel (recommended)** | No router config, works with dynamic IP, HTTPS included | Uses a third‑party service |
| **Port forwarding** | No third party | Router setup, dynamic IP / DNS, HTTPS is extra work |

**Option 2a: Tunnel (easiest)**  
Use a tunnel so the internet can reach your local server:

- **[ngrok](https://ngrok.com)** (free tier):  
  `ngrok http 8080`  
  You get a URL like `https://abc123.ngrok.io`. Overlay URL:  
  `https://abc123.ngrok.io/index.html?team1=...&team2=...&s1=0&s2=0`  
  Control page: `https://abc123.ngrok.io/control.html`  
  (Free URLs can change each time you start ngrok; paid gives a fixed subdomain.)

- **[Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)** (free):  
  Install `cloudflared`, then run a tunnel to `localhost:8080`. You get a fixed `*.trycloudflare.com` or your own domain with HTTPS.

In Streamlabs, use the **HTTPS** overlay URL the tunnel gives you.

**Option 2b: Port forwarding**  
On your router, forward port 80 (or 8080) to the always‑on machine’s local IP. Then:

- If your ISP gives you a **static IP**, overlay URL is:  
  `http://YOUR_PUBLIC_IP/index.html?...`  
  (Use port in the URL if you forwarded 8080: `http://YOUR_PUBLIC_IP:8080/index.html?...`.)

- If your IP **changes**, use a free **Dynamic DNS** service (e.g. No-IP, Duck DNS) and use that hostname instead of the IP.

**HTTPS:** Some embed contexts expect HTTPS. With port forwarding, you’d need a certificate and a reverse proxy (e.g. Caddy). Tunnels give HTTPS without that.

**3. Use the overlay in Streamlabs**  
In Streamlabs Mobile, add a **Custom item → URL** layer and paste the full overlay URL (e.g. your tunnel URL + `/index.html?team1=...&s1=0&s2=0`). Use the control page to build and copy that URL.

### Option D: Your own server (VPS / hosted)

Upload both files to a directory that’s served over HTTPS. Use the full URL to `index.html` (with query params if you want) as the overlay URL in Streamlabs.

## Troubleshooting: Overlay too small

If the overlay looks tiny in Streamlabs:

- **Streamlabs Desktop:** Double‑click the Browser Source in the Sources list → set **Width** to `1920` and **Height** to `1080`. Scene Editor browser sources should use 1920×1080 for correct sizing.
- **Streamlabs Mobile (iOS):** The URL layer size may be limited. Push the latest `index.html` to your host and add `?v=1` (or `?v=2`, etc.) to the overlay URL to avoid cached versions.
- **Cache:** Add `?v=2` to the end of the overlay URL to force Streamlabs to reload the page.

## Tips

- **Bookmark the control page** on your phone so you can update scores and copy the new overlay URL quickly.
- Streamlabs uses **16:9** for the stream; the overlay is designed for 16:9. In portrait mode you’ll see letterboxing; position the overlay in landscape in the editor so it looks right on stream.
- For a “minimal” look, place the overlay in a corner and keep team names short.

## Files

```
scoreboard-overlay/
├── index.html   ← Overlay (use this URL in Streamlabs)
├── control.html ← Set scores and copy overlay URL
├── serve.bat    ← (Windows) Double‑click to run local server on port 8080
└── README.md
```

No build step or server required; plain HTML/CSS/JS.
