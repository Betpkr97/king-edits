import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import crypto from "crypto";
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

// Block direct public access to private order/payment files.
app.use("/uploads", (req, res) => res.status(404).end());
app.use("/orders", (req, res) => res.status(404).end());

// Public website files.
app.use(express.static(__dirname));

function adminConfigReady() {
  return Boolean(process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD && process.env.ADMIN_SECRET);
}

function sign(value) {
  return crypto.createHmac("sha256", process.env.ADMIN_SECRET).update(value).digest("hex");
}

function makeSession(username) {
  const exp = Date.now() + 24 * 60 * 60 * 1000;
  const payload = `${username}|${exp}`;
  return `${Buffer.from(payload).toString("base64url")}.${sign(payload)}`;
}

function readCookie(req, name) {
  const raw = req.headers.cookie || "";
  const part = raw.split(";").map(x => x.trim()).find(x => x.startsWith(`${name}=`));
  return part ? decodeURIComponent(part.slice(name.length + 1)) : "";
}

function isAdmin(req) {
  if (!adminConfigReady()) return false;
  const token = readCookie(req, "ke_admin");
  if (!token.includes(".")) return false;
  const [encoded, signature] = token.split(".");
  try {
    const payload = Buffer.from(encoded, "base64url").toString("utf8");
    const [username, expText] = payload.split("|");
    if (username !== process.env.ADMIN_USERNAME || Number(expText) < Date.now()) return false;
    const expected = sign(payload);
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

function requireAdmin(req, res, next) {
  if (!isAdmin(req)) return res.status(401).json({ ok:false, message:"Admin login required." });
  next();
}

function orderFiles() {
  return fs.readdirSync(ordersDir).filter(f => f.endsWith(".json"));
}
function readOrders() {
  return orderFiles().map(file => {
    try { return JSON.parse(fs.readFileSync(path.join(ordersDir, file), "utf8")); }
    catch { return null; }
  }).filter(Boolean).sort((a,b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}
function saveOrder(order) {
  fs.writeFileSync(path.join(ordersDir, `${order.orderId}.json`), JSON.stringify(order, null, 2));
}

app.post("/api/orders", upload.single("paymentScreenshot"), (req, res) => {
  const { product, price, customerName, whatsapp, email, paymentMethod, transactionId } = req.body || {};
  if (!product || !price || !customerName || !whatsapp || !transactionId || !req.file) {
    return res.status(400).json({ ok:false, message:"Name, WhatsApp number, transaction ID, and payment screenshot are required." });
  }

  const orderId = "KE-" + Date.now().toString().slice(-8);
  const order = {
    orderId, product, price:Number(price), customerName, whatsapp, email:email || "",
    paymentMethod: paymentMethod || "Easypaisa", transactionId,
    paymentScreenshot: req.file.filename,
    status:"PENDING_PAYMENT_VERIFICATION", createdAt:new Date().toISOString()
  };
  saveOrder(order);
  console.log("KING EDITS ORDER:", order);

  res.json({ ok:true, orderId, status:order.status, message:"Order received. Payment is waiting for manual verification." });
});

// Admin authentication
app.post("/api/admin/login", (req, res) => {
  if (!adminConfigReady()) return res.status(503).json({ ok:false, message:"Admin credentials are not configured on the server." });
  const { username, password } = req.body || {};
  if (username !== process.env.ADMIN_USERNAME || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ ok:false, message:"Invalid username or password." });
  }
  const secure = req.secure || req.headers["x-forwarded-proto"] === "https";
  res.setHeader("Set-Cookie", `ke_admin=${encodeURIComponent(makeSession(username))}; HttpOnly; ${secure ? "Secure; " : ""}SameSite=Lax; Path=/; Max-Age=86400`);
  res.json({ ok:true });
});

app.post("/api/admin/logout", (req, res) => {
  const secure = req.secure || req.headers["x-forwarded-proto"] === "https";
  res.setHeader("Set-Cookie", `ke_admin=; HttpOnly; ${secure ? "Secure; " : ""}SameSite=Lax; Path=/; Max-Age=0`);
  res.json({ ok:true });
});

app.get("/api/admin/me", (req, res) => res.json({ ok:isAdmin(req), configured:adminConfigReady() }));

app.get("/api/admin/orders", requireAdmin, (req, res) => {
  const orders = readOrders().map(o => ({ ...o, paymentScreenshot: Boolean(o.paymentScreenshot) }));
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === "PENDING_PAYMENT_VERIFICATION").length,
    paid: orders.filter(o => o.status === "PAID").length,
    delivered: orders.filter(o => o.status === "DELIVERED").length,
    rejected: orders.filter(o => o.status === "REJECTED").length,
    sales: orders.filter(o => ["PAID","DELIVERED"].includes(o.status)).reduce((sum,o) => sum + Number(o.price || 0), 0)
  };
  res.json({ ok:true, orders, stats });
});

app.patch("/api/admin/orders/:orderId", requireAdmin, (req, res) => {
  const file = path.join(ordersDir, `${req.params.orderId}.json`);
  if (!fs.existsSync(file)) return res.status(404).json({ ok:false, message:"Order not found." });
  const allowed = ["PENDING_PAYMENT_VERIFICATION","PAID","DELIVERED","REJECTED"];
  const status = req.body?.status;
  if (!allowed.includes(status)) return res.status(400).json({ ok:false, message:"Invalid status." });
  const order = JSON.parse(fs.readFileSync(file, "utf8"));
  order.status = status;
  order.updatedAt = new Date().toISOString();
  saveOrder(order);
  res.json({ ok:true, order });
});

app.get("/api/admin/orders/:orderId/screenshot", requireAdmin, (req, res) => {
  const file = path.join(ordersDir, `${req.params.orderId}.json`);
  if (!fs.existsSync(file)) return res.status(404).end();
  const order = JSON.parse(fs.readFileSync(file, "utf8"));
  if (!order.paymentScreenshot) return res.status(404).end();
  const screenshot = path.join(uploadsDir, path.basename(order.paymentScreenshot));
  if (!fs.existsSync(screenshot)) return res.status(404).end();
  res.sendFile(screenshot);
});

app.get("/admin", (req, res) => res.sendFile(path.join(__dirname, "admin.html")));

app.use((err, req, res, next) => {
  if (err?.message === "Only image files are allowed.") return res.status(400).json({ ok:false, message:err.message });
  if (err?.code === "LIMIT_FILE_SIZE") return res.status(400).json({ ok:false, message:"Screenshot must be 5MB or smaller." });
  next(err);
});

app.get("*", (req, res) => res.sendFile(path.join(__dirname, "index.html")));

app.listen(PORT, () => console.log(`KING EDITS running on port ${PORT}`));
