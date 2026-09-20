# KING EDITS — Ready Website

## Files
- `index.html` — main website
- `style.css` — responsive dark/gold/purple design
- `app.js` — products, checkout modal and WhatsApp order flow
- `server.js` — Express server + demo order endpoint
- `package.json` — Node.js setup
- `assets/king-edits-logo.png` — cropped from the supplied KING EDITS design
- Product logo images — cropped from the supplied design for CapCut, Canva, Gemini and Veo 3
- `assets/design-reference.jpg` — original supplied design reference

## Run locally
1. Install Node.js.
2. Open this folder in Terminal/CMD.
3. Run:
   `npm install`
4. Then:
   `npm start`
5. Open:
   `http://localhost:3000`

## Important payment note
The website does NOT fake automatic payment confirmation. The current checkout creates an order with `PENDING_PAYMENT` and opens WhatsApp.

For real automatic Easypaisa verification, an approved Easypaisa merchant/online-payment-gateway setup and the provider's current API/callback credentials are required. Add those server-side; never put secret credentials in `app.js` or other frontend files.

## Deploy
Upload the files to GitHub and use:
- Build command: `npm install`
- Start command: `npm start`
