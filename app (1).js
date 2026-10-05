/* CFO Clothing - storefront logic */
(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const WA = '2347073838961';

/* ---------- Images ----------
   Placeholder photos load from picsum.photos. Replace IMG() with your own
   image paths (e.g. `images/${seed}.jpg`) before launch. A branded
   fallback shows if an image fails to load. */
const IMG = (seed, w = 600, h = 750) => `https://picsum.photos/seed/cfo-${seed}/${w}/${h}`;
const FALLBACK = "data:image/svg+xml;utf8," + encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='750'><rect width='100%' height='100%' fill='#050505'/><text x='50%' y='50%' fill='#D4AF37' font-family='Georgia' font-size='54' text-anchor='middle'>CFO</text></svg>`);
document.addEventListener('error', e => { if (e.target.tagName === 'IMG' && e.target.src !== FALLBACK && !e.target.closest('.logo')) e.target.src = FALLBACK; }, true);

/* ---------- Data (prices in USD) ---------- */
const CATS = ['Couples Wear','T-Shirts','Hoodies','Jeans','Shoes','Sneakers','Watches','Accessories','Caps','Bags'];
const FILTERS = [['all','All'],['new','New Arrivals'],['couples','Couples Wear'],['men','Men'],['women','Women']];
const L = f => `images/${f}.jpg`;
const PRODUCTS = [  // Prices in USD (converted live to other currencies)
  {id:1,name:'CFO Heritage Denim Jacket & Jeans Set',price:245,cat:'Jeans',g:['men','women','new'],img:L('saints-set')},
  {id:2,name:'CFO Noir Script Hoodie & Joggers Set',price:165,cat:'Hoodies',g:['couples','men','women','new'],img:L('script-hoodie-set')},
  {id:3,name:'CFO Sky Two-Piece Set',price:145,cat:'Sets',g:['men','new'],img:L('blue-set')},
  {id:4,name:'CFO Washed Statement Tee',price:55,cat:'T-Shirts',g:['men','women']  ,img:L('money-tee')},
  {id:5,name:'CFO Cross Oversized Tee',price:59,cat:'T-Shirts',g:['men','women','new'],img:L('cross-tee')},
  {id:6,name:'CFO Essential Long-Sleeve Tee',price:49,cat:'T-Shirts',g:['women','men'],img:L('red-logo-tee')},
  {id:7,name:'CFO Club Polo',price:69,cat:'T-Shirts',g:['men','women'],img:L('football-polo')},
  {id:8,name:'CFO Monochrome Cuban Shirt',price:75,cat:'Shirts',g:['men','new'],img:L('print-shirt')},
  {id:9,name:'CFO Palm Resort Shirt',price:65,cat:'Shirts',g:['men'],img:L('palm-shirt')},
  {id:10,name:'CFO Vintage Plaid Shirt',price:45,cat:'Shirts',g:['men','women'],img:L('plaid-shirts')},
  {id:11,name:'CFO Rose Shirt & Shorts Set',price:89,cat:'Sets',g:['couples','men'],img:L('rose-set')},
  {id:12,name:'CFO Wide-Leg Script Joggers',price:69,cat:'Joggers',g:['men','women'],img:L('grey-joggers')}
];
// Category card photos (categories without a photo use a placeholder)
const CAT_IMG = {'Couples Wear':'images/banner.jpg','T-Shirts':L('money-tee'),'Hoodies':L('script-hoodie-set'),'Jeans':L('saints-set'),'Shoes':L('blue-set')};
const SOCIAL = {Instagram:'<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/>',Facebook:'<path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8z"/>',TikTok:'<path d="M14 3v11a4 4 0 1 1-4-4M14 3c0 3 2 5 5 5"/>',YouTube:'<rect x="2" y="5" width="20" height="14" rx="4"/><path d="m10 9 5 3-5 3z"/>',X:'<path d="M4 4l16 16M20 4 4 20"/>'};
const TRUST = [['Worldwide Shipping','<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>'],['Secure Payments','<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'],['Quality Products','<path d="m12 3 2.7 5.5 6 .9-4.4 4.2 1 6-5.3-2.8-5.3 2.8 1-6L3.3 9.400l6-.9z"/>'],['Easy Returns','<path d="M4 12a8 8 0 1 0 3-6.200M4 4v4h4"/>'],['24/7 Support','<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="14" width="4" height="6" rx="1.500"/><rect x="17" y="14" width="4" height="6" rx="1.500"/>'],['Fast Delivery','<path d="M2 6h12v10H2zM14 10h4l4 3v3h-8z"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>']];

/* ---------- Storage helpers ---------- */
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
let cart = load('cfo_cart', []);        // [{id, qty}]
let wish = load('cfo_wish', []);        // [id]
let promo = load('cfo_promo', null);    // {code, pct}
let currency = load('cfo_cur', 'USD');

/* ---------- Currency (live rates, cached 6h, offline fallback) ---------- */
const CURRENCIES = ['USD','EUR','GBP','NGN','CAD','AUD','GHS','KES','UGX','ZAR','INR','JPY','CNY'];
let rates = load('cfo_rates', {USD:1,EUR:.92,GBP:.79,NGN:1550,CAD:1.37,AUD:1.52,GHS:15,KES:129,UGX:3700,ZAR:18,INR:84,JPY:150,CNY:7.2});
async function fetchRates() {
  const cached = load('cfo_rates_t', 0);
  if (Date.now() - cached < 6 * 3600e3) return;
  try {
    const r = await fetch('https://open.er-api.com/v6/latest/USD');
    const d = await r.json();
    if (d.result === 'success') {
      CURRENCIES.forEach(c => { if (d.rates[c]) rates[c] = d.rates[c]; });
      save('cfo_rates', rates); save('cfo_rates_t', Date.now());
      renderAll();
    }
  } catch { /* keep fallback rates */ }
}
const money = usd => new Intl.NumberFormat('en', {style:'currency', currency, maximumFractionDigits: ['JPY','UGX','NGN','KES'].includes(currency) ? 0 : 2}).format(usd * (rates[currency] || 1));

/* ---------- Toast ---------- */
let tt;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('on'), 2400); }

/* ---------- Render: static sections ---------- */
function renderStatic() {
  $('#year').textContent = new Date().getFullYear();
  $('#currency').innerHTML = CURRENCIES.map(c => `<option ${c === currency ? 'selected' : ''}>${c}</option>`).join('');
  $('#catGrid').innerHTML = CATS.map(c => `<a href="#shop" class="cat" data-cat="${c}"><img loading="lazy" src="${CAT_IMG[c] || IMG(c.replace(/\W/g,''), 480, 600)}" alt="${c}"><span>${c}</span></a>`).join('');
  $('#filters').innerHTML = FILTERS.map(([k, l], i) => `<button data-filter="${k}" class="${i ? '' : 'on'}">${l}</button>`).join('');
  $('#trustGrid').innerHTML = TRUST.map(([t, p]) => `<div class="trust-item"><i><svg viewBox="0 0 24 24">${p}</svg></i>${t}</div>`).join('');
  $('#instaGrid').innerHTML = ['banner','money-tee','script-hoodie-set','blue-set','palm-shirt','rose-set'].map((f, i) => `<a class="insta" href="https://instagram.com" target="_blank" rel="noopener" aria-label="Instagram post ${i + 1}"><img loading="lazy" src="images/${f}.jpg" alt="CFO Clothing style ${i + 1}"></a>`).join('');
  $('#social').innerHTML = Object.entries(SOCIAL).map(([n, p]) => `<a href="#" aria-label="${n}"><svg viewBox="0 0 24 24">${p}</svg></a>`).join('');
}

/* ---------- Products ---------- */
let filter = 'all', query = '', catFilter = '';
function renderProducts() {
  const list = PRODUCTS.filter(p =>
    (filter === 'all' || p.g.includes(filter)) &&
    (!catFilter || p.cat === catFilter || (catFilter === 'Couples Wear' && p.g.includes('couples'))) &&
    (!query || (p.name + ' ' + p.cat).toLowerCase().includes(query)));
  $('#prodGrid').innerHTML = list.map(p => `
    <article class="card">
      <div class="card-img">
        <img loading="lazy" src="${p.img}" alt="${p.name}">
        ${p.g.includes('new') ? '<span class="tag">NEW</span>' : ''}
        <button class="wish ${wish.includes(p.id) ? 'on' : ''}" data-wish="${p.id}" aria-label="Add ${p.name} to wishlist"><svg viewBox="0 0 24 24"><path d="M12 21s-8-5.200-8-11a4.500 4.500 0 0 1 8-2.800A4.500 4.500 0 0 1 20 10c0 5.800-8 11-8 11z"/></svg></button>
        <button class="quick" data-quick="${p.id}">Quick View</button>
      </div>
      <h3>${p.name}</h3>
      <div class="price">${money(p.price)}</div>
      <button class="btn dark" data-add="${p.id}">Add To Cart</button>
    </article>`).join('');
  $('#noResults').hidden = list.length > 0;
}

/* ---------- Cart ---------- */
const SHIP_FLAT = 15, FREE_OVER = 200;               // USD
const CODES = {CFO10: .10, WELCOME15: .15, LUXURY20: .20};
const findP = id => PRODUCTS.find(p => p.id === id);
function totals() {
  const sub = cart.reduce((s, i) => s + findP(i.id).price * i.qty, 0);
  const disc = promo ? sub * promo.pct : 0;
  const ship = !cart.length || sub - disc >= FREE_OVER ? 0 : SHIP_FLAT;
  return {sub, disc, ship, total: sub - disc + ship};
}
function renderCart() {
  const n = cart.reduce((s, i) => s + i.qty, 0);
  $('#cartCount').textContent = n;
  $('#wishCount').textContent = wish.length;
  $('#cartItems').innerHTML = cart.length ? cart.map(i => { const p = findP(i.id); return `
    <div class="line">
      <img src="${p.img}" alt="${p.name}">
      <div><h4>${p.name}</h4><div class="price">${money(p.price)}</div>
        <div class="qty"><button data-dec="${p.id}" aria-label="Decrease quantity">&minus;</button><span>${i.qty}</span><button data-inc="${p.id}" aria-label="Increase quantity">+</button></div></div>
      <button class="rm" data-rm="${p.id}">Remove</button>
    </div>`; }).join('') : '<p class="empty">Your cart is empty. Add a piece you love to get started.</p>';
  const t = totals();
  $('#sSub').textContent = money(t.sub);
  $('#sDisc').textContent = t.disc ? '-' + money(t.disc) : money(0);
  $('#sShip').textContent = t.ship ? money(t.ship) : (cart.length ? 'Free' : money(0));
  $('#sTotal').textContent = money(t.total);
  $('#cartFoot').style.display = cart.length ? '' : 'none';
  save('cfo_cart', cart); save('cfo_promo', promo);
}
function addToCart(id) {
  const it = cart.find(i => i.id === id);
  it ? it.qty++ : cart.push({id, qty: 1});
  renderCart();
  const b = $('#cartCount'); b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump');
  toast(findP(id).name + ' added to cart');
}
function setQty(id, d) {
  const it = cart.find(i => i.id === id); if (!it) return;
  it.qty += d; if (it.qty < 1) cart = cart.filter(i => i.id !== id);
  renderCart();
}
function toggleWish(id) {
  wish = wish.includes(id) ? wish.filter(w => w !== id) : [...wish, id];
  save('cfo_wish', wish); renderProducts(); renderCart();
  toast(wish.includes(id) ? 'Saved to wishlist' : 'Removed from wishlist');
}
function drawer(open) {
  $('#drawer').classList.toggle('open', open); $('#overlay').classList.toggle('on', open);
  $('#drawer').setAttribute('aria-hidden', !open);
  document.body.style.overflow = open ? 'hidden' : '';
}
function quickView(id) {
  const p = findP(id);
  $('#modalBox').innerHTML = `<button class="icon-btn modal-x" data-close aria-label="Close"><svg viewBox="0 0 24 24"><path d="M5 5l14 14M19 5 5 19"/></svg></button>
    <img src="${p.img}" alt="${p.name}">
    <div class="modal-info"><h3>${p.name}</h3><div class="price">${money(p.price)}</div>
    <p>${p.cat}. Premium fabric, precise fit and a finish made to last. Ships worldwide.</p>
    <button class="btn gold full" data-add="${p.id}" data-close>Add To Cart</button></div>`;
  $('#modal').classList.add('open');
}

/* ---------- Reviews: 1,000 generated, rotate every 30s ---------- */
const NG = ['Lagos','Abuja','Port Harcourt','Enugu','Owerri','Uyo','Calabar','Benin','Ibadan','Kano','Kaduna','Jos','Abeokuta','Warri','Asaba','Onitsha','Akure','Ilorin'];
const OTHER = [['Douala','Cameroon'],['Accra','Ghana'],['Johannesburg','South Africa'],['Nairobi','Kenya'],['London','United Kingdom'],['Toronto','Canada'],['Houston','United States'],['Berlin','Germany'],['Paris','France'],['Dubai','UAE']];
const FIRST = ['Chidinma','Emeka','Aisha','Tunde','Ngozi','Ifeanyi','Funke','Chukwudi','Blessing','Segun','Amaka','Yusuf','Ekaette','Obinna','Zainab','Kelechi','Bukola','Ibrahim','Nneka','Femi','Adaeze','Musa','Folake','Uche','Halima','Tochi','Damilola','Efe','Ruth','Samuel','Grace','Daniel','Esther','Michael','Linda','Kwame','Ama','Thabo','Wanjiru','Brian','Sophie','Marie','Hans','Fatima','Omar','Jessica','James','Amara','Joy','Peter'];
const LAST = ['Okafor','Adeyemi','Bello','Nwosu','Ibrahim','Eze','Balogun','Okoro','Udoh','Abubakar','Obi','Afolabi','Etim','Nnamdi','Lawal','Ogunleye','Onyeka','Danjuma','Ojo','Agu','Mensah','Dlamini','Kamau','Smith','Müller','Dubois','Nkemelu','Hassan','Brown','Williams'];
const OPEN = ['The quality of my order blew me away.','I was nervous ordering from abroad, but it was worth it.','Absolutely love the fit.','Stylish, sharp and well made.','My partner and I wore our matching set to a wedding.','Third order and I am still impressed.','Delivery was faster than I expected.','The fabric feels truly premium.','Compliments everywhere I go.','Exactly as shown in the photos.'];
const ITEM = ['The couples hoodies are heavy, soft and hold their shape after washing.','The black tee has become my everyday piece.','The jeans fit perfectly and the denim feels rich.','The sneakers are comfortable from the very first day.','The gold watch looks far more expensive than it is.','The weekender bag is spacious and the leather is beautiful.','The matching set fit both of us without any alterations.','The cap is well stitched and sits right.'];
const CLOSE = ['Support on WhatsApp answered within minutes.','Packaging was neat and felt like a gift.','Will be ordering again very soon.','Highly recommended to anyone who loves good style.','Sizing was accurate and returns were not even needed.','Fashion beyond expectations indeed.','Already told my friends and family about CFO Clothing.'];
let seed = 20240917;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const pick = a => a[Math.floor(rnd() * a.length)];
const REVIEWS = Array.from({length: 1000}, () => {
  const ng = rnd() < .7, [city, country] = ng ? [pick(NG), 'Nigeria'] : pick(OTHER);
  const name = pick(FIRST) + ' ' + pick(LAST), d = new Date(Date.now() - Math.floor(rnd() * 365) * 864e5);
  return {name, city, country, date: d.toLocaleDateString('en-GB', {day:'numeric', month:'long', year:'numeric'}),
          text: [pick(OPEN), pick(ITEM), pick(CLOSE)].join(' '), hue: Math.floor(rnd() * 40) + 38};
});
let revIdx = 0, revTimer;
const perView = () => innerWidth >= 1024 ? 3 : innerWidth >= 640 ? 2 : 1;
function showReviews(step = 0, animate = true) {
  const n = perView(), stage = $('#revStage');
  revIdx = (revIdx + step * n + REVIEWS.length) % REVIEWS.length;
  const draw = () => {
    stage.innerHTML = Array.from({length: n}, (_, k) => REVIEWS[(revIdx + k) % REVIEWS.length]).map(r => `
      <article class="rev"><div class="rev-top"><div class="av" style="background:hsl(${r.hue} 62% 52%)">${r.name.split(' ').map(w => w[0]).join('')}</div>
      <div><strong>${r.name}</strong><small>${r.city}, ${r.country}</small></div></div>
      <div class="stars" aria-label="5 out of 5 stars">★★★★★</div><p>${r.text}</p><time>${r.date}</time></article>`).join('');
    stage.classList.remove('out');
    $('#revCount').textContent = `${revIdx + 1}-${Math.min(revIdx + n, REVIEWS.length)} of ${REVIEWS.length}`;
  };
  if (animate) { stage.classList.add('out'); setTimeout(draw, 450); } else draw();
}
function startRevTimer() { clearInterval(revTimer); revTimer = setInterval(() => showReviews(1), 30000); }

/* ---------- Hero slider ---------- */
const HERO = ['images/banner.jpg','images/blue-set.jpg'];  // add more banners here
let hi = 0, ht;
function initHero() {
  $('#slides').innerHTML = HERO.map((s, i) => `<div class="slide ${i ? '' : 'on'}" style="background-image:url('${s}'),linear-gradient(135deg,#050505,#2a2208)"></div>`).join('');
  $('#dots').innerHTML = HERO.map((_, i) => `<button class="${i ? '' : 'on'}" data-slide="${i}" aria-label="Go to slide ${i + 1}"></button>`).join('');
  const go = i => { hi = i; $$('.slide').forEach((s, k) => s.classList.toggle('on', k === i)); $$('#dots button').forEach((d, k) => d.classList.toggle('on', k === i)); };
  const auto = () => { clearInterval(ht); ht = setInterval(() => go((hi + 1) % HERO.length), 5500); };
  $('#dots').addEventListener('click', e => { const b = e.target.closest('[data-slide]'); if (b) { go(+b.dataset.slide); auto(); } });
  auto();
}

/* ---------- Events ---------- */
function bind() {
  document.addEventListener('click', e => {
    const t = e.target, q = s => t.closest(s);
    let el;
    if ((el = q('[data-add]'))) addToCart(+el.dataset.add);
    if ((el = q('[data-wish]'))) toggleWish(+el.dataset.wish);
    if ((el = q('[data-quick]'))) quickView(+el.dataset.quick);
    if ((el = q('[data-inc]'))) setQty(+el.dataset.inc, 1);
    if ((el = q('[data-dec]'))) setQty(+el.dataset.dec, -1);
    if ((el = q('[data-rm]'))) { cart = cart.filter(i => i.id !== +el.dataset.rm); renderCart(); }
    if (q('[data-close]') || t.id === 'modal') $('#modal').classList.remove('open');
    if ((el = q('[data-cat]'))) { catFilter = el.dataset.cat; filter = 'all'; query = ''; setFilterUI('all'); renderProducts(); }
    if ((el = q('[data-filter]'))) { filter = el.dataset.filter; catFilter = ''; setFilterUI(filter); renderProducts(); $('#nav').classList.remove('open'); }
    if (q('.nav a')) $('#nav').classList.remove('open');
  });
  const setFilterUI = f => $$('#filters button').forEach(b => b.classList.toggle('on', b.dataset.filter === f));
  $('#menuBtn').onclick = () => $('#nav').classList.toggle('open');
  $('#cartBtn').onclick = () => drawer(true);
  $('#closeCart').onclick = $('#overlay').onclick = () => drawer(false);
  $('#wishBtn').onclick = () => { filter = 'all'; catFilter = ''; query = ''; renderProducts(); if (wish.length) { $$('.card').forEach(c => { if (!wish.includes(+c.querySelector('[data-add]').dataset.add)) c.remove(); }); } toast(wish.length ? 'Showing your wishlist' : 'Your wishlist is empty'); $('#shop').scrollIntoView(); };
  $('#accBtn').onclick = () => toast('Customer accounts are coming soon. Order via WhatsApp for now.');
  $('#trackLink').onclick = e => { e.preventDefault(); open(`https://wa.me/${WA}?text=${encodeURIComponent('Hello CFO Clothing, I would like to track my order.')}`, '_blank'); };
  $('#currency').onchange = e => { currency = e.target.value; save('cfo_cur', currency); renderAll(); };
  $('#searchForm').onsubmit = e => { e.preventDefault(); query = $('#searchInput').value.trim().toLowerCase(); catFilter = ''; renderProducts(); $('#shop').scrollIntoView(); };
  $('#searchInput').oninput = e => { if (!e.target.value) { query = ''; renderProducts(); } };
  $('#promoForm').onsubmit = e => {
    e.preventDefault(); const c = $('#promoInput').value.trim().toUpperCase();
    if (CODES[c]) { promo = {code: c, pct: CODES[c]}; $('#promoMsg').textContent = `${c} applied: ${CODES[c] * 100}% off`; }
    else { promo = null; $('#promoMsg').textContent = 'That code is not valid. Check the spelling and try again.'; }
    renderCart();
  };
  $('#checkout').onclick = () => {
    const t = totals();
    const lines = cart.map(i => `${i.qty} x ${findP(i.id).name} (${money(findP(i.id).price * i.qty)})`).join('\n');
    const msg = `Hello CFO Clothing, I would like to order:\n${lines}\n\nSubtotal: ${money(t.sub)}\nDiscount: ${money(t.disc)}\nShipping: ${money(t.ship)}\nTotal: ${money(t.total)} (${currency})`;
    open(`https://wa.me/${WA}?text=${encodeURIComponent(msg)}`, '_blank');
  };
  $('#newsForm').onsubmit = e => { e.preventDefault(); e.target.reset(); $('#newsMsg').textContent = 'Thank you for subscribing. Look out for our next drop.'; };
  $('#revPrev').onclick = () => { showReviews(-1); startRevTimer(); };
  $('#revNext').onclick = () => { showReviews(1); startRevTimer(); };
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { drawer(false); $('#modal').classList.remove('open'); $('#nav').classList.remove('open'); } });
  addEventListener('scroll', () => $('#header').classList.toggle('scrolled', scrollY > 10), {passive: true});
  let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => showReviews(0, false), 200); });
  const io = new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } }), {threshold: .12});
  $$('.reveal').forEach(el => io.observe(el));
}

function renderAll() { renderProducts(); renderCart(); }
renderStatic(); initHero(); renderAll(); showReviews(0, false); startRevTimer(); bind(); fetchRates();
})();
