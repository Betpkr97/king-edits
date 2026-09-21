KING EDITS
Premium digital tools storefront for KING EDITS by Abrar Ali.
Manual Easypaisa checkout
Customers send the exact amount to:
Easypaisa: 03013221259
Account name: Altaf Hussain
Checkout now collects:
Customer name
WhatsApp number
Optional email
Easypaisa transaction ID (required)
Payment screenshot (optional)
Orders are submitted to /api/orders and remain PENDING_PAYMENT_VERIFICATION until payment is manually checked. The site does not claim automatic Easypaisa verification.
Run locally
npm install
npm start
The server uses Express and Multer for optional payment screenshot uploads. Uploaded screenshots are stored in the uploads/ directory on the server.
Manual payment verification
The checkout requires an Easypaisa transaction ID and payment screenshot. The server stores the order as a JSON file under orders/ and the uploaded screenshot under uploads/. Payment is NOT automatically verified; an admin must manually check the transfer.
Product prices
CapCut Pro — Rs. 700
Canva Pro — Rs. 400
Gemini Pro — Rs. 1,000
Veo 3 — Rs. 1,700
ChatGPT Pro — Rs. 1,500
Claude Pro — Rs. 1,600
