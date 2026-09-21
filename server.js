import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
const uploadsDir = path.join(__dirname, "uploads");
const ordersDir = path.join(__dirname, "orders");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(ordersDir)) fs.mkdirSync(ordersDir, { recursive: true });
const upload = multer({
  dest: uploadsDir,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed."));
  }
});
app.use("/uploads", express.static(uploadsDir));
app.use(express.static(__dirname));

app.post("/api/orders", upload.single("paymentScreenshot"), (req, res) => {
  const { product, price, customerName, whatsapp, email, paymentMethod, transactionId } = req.body || {};
  if (!product || !price || !customerName || !whatsapp || !transactionId || !req.file) {
    return res.status(400).json({ ok:false, message:"Name, WhatsApp number, transaction ID, and payment screenshot are required." });
  }

  // Manual-payment order endpoint.
  // IMPORTANT: This does NOT verify Easypaisa payments.
  // Replace/extend this endpoint with the official Easypaisa merchant/gateway callback
  // when approved merchant credentials and current provider docs are available.
  const orderId = "KE-" + Date.now().toString().slice(-8);
  const order = {
    orderId, product, price:Number(price), customerName, whatsapp, email:email || "",
    paymentMethod: paymentMethod || "Easypaisa", transactionId,
    paymentScreenshot: req.file ? `/uploads/${req.file.filename}` : null,
    status:"PENDING_PAYMENT_VERIFICATION", createdAt:new Date().toISOString()
  };
  fs.writeFileSync(path.join(ordersDir, `${orderId}.json`), JSON.stringify(order, null, 2));
  console.log("KING EDITS ORDER:", order);

  res.json({
    ok:true,
    orderId,
    status:"PENDING_PAYMENT_VERIFICATION",
    message:"Order received. Payment must be verified through the configured gateway."
  });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => console.log(`KING EDITS running on http://localhost:${PORT}`));
