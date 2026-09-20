const products = [
  {id:"capcut",name:"CapCut Pro",price:700,tag:"Official",image:"assets/capcut-logo.png",items:["Official account","1 Month validity","Premium features"]},
  {id:"canva",name:"Canva Pro",price:400,tag:"Official Gmail",image:"assets/canva-logo.png",items:["Official Gmail account","1 Month validity","Full premium features"]},
  {id:"gemini",name:"Gemini Pro",price:1000,tag:"Google Official",image:"assets/gemini-logo.png",items:["Official account","1 Month validity","Latest AI features"]},
  {id:"veo3",name:"Veo 3",price:1700,tag:"Google Official",image:"assets/veo3-logo.png",items:["Official account","1 Month validity","AI video generation"]}
];

const grid = document.getElementById("productsGrid");
const modal = document.getElementById("checkoutModal");
const toast = document.getElementById("toast");
let selectedProduct = null;
let cart = [];

function money(n){ return "Rs. " + n.toLocaleString("en-PK"); }

grid.innerHTML = products.map(p => `
  <article class="product-card">
    <div class="product-icon"><img src="${p.image}" alt="${p.name} logo"></div>
    <h3>${p.name}</h3>
    <span class="pill">${p.tag}</span>
    <ul>${p.items.map(x=>`<li>${x}</li>`).join("")}</ul>
    <div class="price">${money(p.price)}</div>
    <button class="btn buy" onclick="openCheckout('${p.id}')">Buy Now →</button>
  </article>
`).join("");

window.openCheckout = function(id){
  selectedProduct = products.find(p=>p.id===id);
  document.getElementById("checkoutTitle").textContent = selectedProduct.name;
  document.getElementById("checkoutSummary").innerHTML =
    `<b>${selectedProduct.name}</b><br><span>${selectedProduct.tag}</span><br><strong>${money(selectedProduct.price)}</strong>`;
  modal.classList.add("show");
  modal.setAttribute("aria-hidden","false");
};

document.getElementById("closeModal").onclick = closeModal;
modal.addEventListener("click", e => { if(e.target === modal) closeModal(); });
function closeModal(){ modal.classList.remove("show"); modal.setAttribute("aria-hidden","true"); }

document.getElementById("orderForm").addEventListener("submit", async e => {
  e.preventDefault();
  if(!selectedProduct) return;
  const name = document.getElementById("customerName").value.trim();
  const whatsapp = document.getElementById("customerWhatsapp").value.trim();
  const email = document.getElementById("customerEmail").value.trim();
  const order = {
    product:selectedProduct.name,
    price:selectedProduct.price,
    customerName:name,
    whatsapp,
    email,
    paymentMethod:"Easypaisa",
    status:"PENDING_PAYMENT",
    createdAt:new Date().toISOString()
  };

  // Backend is optional. If unavailable, open WhatsApp with an order summary.
  try {
    const res = await fetch("/api/orders", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify(order)
    });
    if(!res.ok) throw new Error("API unavailable");
  } catch {
    // No fake payment confirmation: the customer is clearly told the order is pending.
  }

  const msg = `KING EDITS ORDER%0AProduct: ${encodeURIComponent(selectedProduct.name)}%0APrice: ${encodeURIComponent(money(selectedProduct.price))}%0AName: ${encodeURIComponent(name)}%0AWhatsApp: ${encodeURIComponent(whatsapp)}%0APayment: Easypaisa%0AStatus: PENDING PAYMENT VERIFICATION`;
  window.open(`https://wa.me/923061358424?text=${msg}`,"_blank");
  closeModal();
  showToast("Order created. WhatsApp opened for support/payment verification.");
  e.target.reset();
});

document.getElementById("cartBtn").onclick = () => {
  showToast("Cart is ready for multi-product checkout in the next upgrade.");
};
document.getElementById("searchBtn").onclick = () => {
  const q = prompt("Search product:");
  if(!q) return;
  const found = products.find(p=>p.name.toLowerCase().includes(q.toLowerCase()));
  showToast(found ? `${found.name} — ${money(found.price)}` : "Product not found.");
};
document.getElementById("menuBtn").onclick = () => document.getElementById("nav").classList.toggle("open");

function showToast(message){
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(()=>toast.classList.remove("show"),3500);
}
