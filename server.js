import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

app.post("/api/orders", (req, res) => {
  const { product, price, customerName, whatsapp } = req.body || {};
  if (!product || !price || !customerName || !whatsapp) {
    return res.status(400).json({ ok:false, message:"Missing required order fields." });
  }

  // Demo order endpoint.
  // IMPORTANT: This does NOT verify Easypaisa payments.
  // Replace this endpoint with the official Easypaisa merchant/gateway callback
  // after merchant credentials and the provider's current integration docs are available.
  const orderId = "KE-" + Date.now().toString().slice(-8);
  console.log({ orderId, ...req.body, status:"PENDING_PAYMENT" });

  res.json({
    ok:true,
    orderId,
    status:"PENDING_PAYMENT",
    message:"Order received. Payment must be verified through the configured gateway."
  });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => console.log(`KING EDITS running on http://localhost:${PORT}`));
