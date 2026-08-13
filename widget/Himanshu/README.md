# Hospilot HIS Widget & Plan Viewer (Part 1)

This project contains the implementation of Part 1 of the Hospilot Full-Stack Assessment. It embeds a custom floating AI assistant widget into the hospital's HIS dashboard and communicates securely with the Hospilot API through a proxy backend.

## Architecture

```
[HIS Dashboard] <---> [Local Express Backend] <---> [Hospilot API (carer.ai)]
       |
       v (launches iframe on success)
[Hospilot Plan Viewer Iframe] (receives sessionId & token via postMessage)
```

1. **Frontend (`public/demo.html`)**: Embeds a floating chat trigger and panel at the bottom right. Once a goal is entered, it invokes the local backend, receives the session details, and polls for status.
2. **Backend (`server.js`)**: Securely holds the `HOSPILOT_USERNAME` and `HOSPILOT_PASSWORD` environment variables. It logs into the Hospilot API on demand to get a token, creates the session, prefixes goals with `[CANDIDATE-Himanshu]`, and proxies the polling endpoint to prevent direct client-side API requests.
3. **Iframe Handshake**: When the plan becomes ready (the `pipeline` object is non-empty), a "View Plan" button appears. It loads the `https://hospilot.carer.ai` iframe, waits for the load event, and issues a postMessage containing the exact required handshake contract: `{ type: "widget_init", token, sessionId }`.

## Running Locally

1. Navigate to the folder:
   ```bash
   cd widget/Himanshu
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create your `.env` file from the example:
   ```bash
   cp .env.example .env
   ```

4. Open `.env` and fill in your real credentials:
   ```env
   HOSPILOT_USERNAME=your_username
   HOSPILOT_PASSWORD=your_password
   PORT=3000
   ```

5. Launch the application:
   ```bash
   npm run dev
   ```

6. Open `http://localhost:3000` in your web browser.

## Deployment on Vercel

The project is fully pre-configured for Vercel deployment via `vercel.json`.

### How to Deploy:

1. Install the Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Run `vercel` from the `widget/Himanshu` directory to deploy:
   ```bash
   vercel
   ```

3. Configure your Environment Variables in the Vercel dashboard:
   * `HOSPILOT_USERNAME`
   * `HOSPILOT_PASSWORD`

4. Deploy to production:
   ```bash
   vercel --prod
   ```
