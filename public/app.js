const fallbackListings = [
  {
    id: "villa-biarritz",
    title: "Villa calme a Biarritz",
    city: "Biarritz",
    price: 120,
    guests: 4,
    noise: 32,
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=1400&q=80",
    description: "Une villa lumineuse a dix minutes de l'ocean, isolee des axes passants et pensee pour des sejours reposants.",
    amenities: ["Jardin prive", "Cuisine equipee", "Parking", "Espace yoga", "Wifi fibre"],
    reviews: ["Silence rare pour Biarritz, parfait pour teletravailler.", "Tres belle lumiere et nuits vraiment calmes."]
  },
  {
    id: "studio-annecy",
    title: "Studio zen a Annecy",
    city: "Annecy",
    price: 85,
    guests: 2,
    noise: 30,
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1400&q=80",
    description: "Un cocon minimaliste proche du lac, avec double vitrage, literie premium et ambiance apaisante.",
    amenities: ["Vue montagne", "Kitchenette", "Double vitrage", "Literie queen", "Local velo"],
    reviews: ["Petit mais tres bien pense.", "Le quartier est doux et silencieux le soir."]
  },
  {
    id: "maison-aix",
    title: "Maison nature a Aix-en-Provence",
    city: "Aix-en-Provence",
    price: 150,
    guests: 6,
    noise: 34,
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=1400&q=80",
    description: "Maison familiale au bord des pins, grande terrasse ombragee et pieces fraiches pour ralentir le rythme.",
    amenities: ["Terrasse", "Piscine", "Climatisation douce", "Bureau", "Barbecue"],
    reviews: ["Ideal avec enfants, beaucoup d'espace.", "On entend surtout les cigales."]
  },
  {
    id: "cabane-dordogne",
    title: "Cabane boisee en Dordogne",
    city: "Dordogne",
    price: 95,
    guests: 3,
    noise: 28,
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1482192505345-5655af888cc4?auto=format&fit=crop&w=1400&q=80",
    description: "Cabane en bois avec poele, grande baie vitree et sentier prive au coeur d'un domaine forestier.",
    amenities: ["Poele a bois", "Sentier prive", "Petit dejeuner", "Hamac", "Cuisine compacte"],
    reviews: ["Le lieu le plus calme que nous ayons reserve.", "Simple, chaleureux, impeccable."]
  },
  {
    id: "appartement-nice",
    title: "Appartement vue mer a Nice",
    city: "Nice",
    price: 130,
    guests: 4,
    noise: 35,
    rating: 4.6,
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80",
    description: "Appartement aerien sur une rue residentielle, balcon mer et chambres cote cour pour des nuits paisibles.",
    amenities: ["Balcon", "Vue mer", "Ascenseur", "Climatisation", "Lave-linge"],
    reviews: ["Tres bien place sans etre bruyant.", "Balcon parfait pour le petit dejeuner."]
  },
  {
    id: "chalet-chamonix",
    title: "Chalet paisible a Chamonix",
    city: "Chamonix",
    price: 170,
    guests: 5,
    noise: 31,
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1518732714860-b62714ce0c59?auto=format&fit=crop&w=1400&q=80",
    description: "Chalet chaleureux avec vue sur les sommets, sauna, coin lecture et isolation acoustique renforcee.",
    amenities: ["Sauna", "Cheminee", "Local ski", "Cuisine ouverte", "Coin lecture"],
    reviews: ["Le chalet est aussi calme que beau.", "Tres confortable apres les randonnees."]
  }
];

const app = document.querySelector("#app");
const template = document.querySelector("#listingCardTemplate");
const themeToggle = document.querySelector("#themeToggle");
const euro = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
let listings = fallbackListings;
let currentBooking = null;
let supabaseClient = null;
let supabaseConfigured = false;
let currentUser = null;

init();

async function init() {
  setupTheme();
  await setupAccount();
  listings = await fetchListings();
  window.addEventListener("hashchange", () => render());
  
  const searchInput = document.querySelector("#searchInput");
  const searchBtn = document.querySelector("#searchSubmitBtn");
  const doSearch = () => {
    if (searchInput) {
      const q = searchInput.value.trim();
      location.hash = q ? `#/listings?city=${encodeURIComponent(q)}` : `#/`;
    }
  };
  if (searchBtn) searchBtn.addEventListener("click", doSearch);
  if (searchInput) searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") doSearch();
  });

  document.querySelector(".user-menu")?.addEventListener("click", (e) => {
    e.preventDefault();
    location.hash = "#/account";
  });

  document.querySelector("#newsletterForm")?.addEventListener("submit", submitNewsletter);

  await render();
}

function setupTheme() {
  const savedTheme = localStorage.getItem("zenstay-theme");
  if (savedTheme === "dark") document.body.classList.add("dark");
  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    localStorage.setItem("zenstay-theme", document.body.classList.contains("dark") ? "dark" : "light");
  });
}

async function setupAccount() {
  currentUser = readLocalUser();
  try {
    const response = await fetch("/api/config");
    const config = await response.json();
    if (config.supabaseUrl && config.supabaseAnonKey) {
      supabaseConfigured = true;
      currentUser = null;
      const { createClient } = await withTimeout(
        import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm"),
        1800
      );
      supabaseClient = createClient(config.supabaseUrl, config.supabaseAnonKey);
      const { data } = await supabaseClient.auth.getSession();
      currentUser = data.session?.user || null;
      supabaseClient.auth.onAuthStateChange((_event, session) => {
        currentUser = session?.user || null;
        updateAccountLink();
      });
    }
  } catch {
    supabaseClient = null;
    if (supabaseConfigured) currentUser = null;
  }
  updateAccountLink();
}

function withTimeout(promise, timeoutMs) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), timeoutMs))
  ]);
}

async function authHeaders() {
  if (!supabaseClient) return {};
  const { data } = await supabaseClient.auth.getSession();
  const token = data.session?.access_token;
  currentUser = data.session?.user || null;
  updateAccountLink();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function refreshCurrentUser() {
  if (!supabaseClient) return currentUser;
  const { data } = await supabaseClient.auth.getSession();
  currentUser = data.session?.user || null;
  updateAccountLink();
  return currentUser;
}

function updateAccountLink() {
  const accountLink = document.querySelector(".user-menu");
  if (!accountLink) return;
  accountLink.href = currentUser ? "#/account" : "#/login";
  accountLink.title = currentUser?.email || "Connexion";
}

async function fetchListings() {
  try {
    const response = await fetch("/api/listings");
    if (!response.ok) throw new Error("API indisponible");
    const data = await response.json();
    return data.listings;
  } catch {
    return fallbackListings;
  }
}

async function render() {
  await refreshCurrentUser();

  // Check if we're on the /success path (Stripe redirect)
  if (location.pathname === "/success" && !location.hash) {
    const params = new URLSearchParams(location.search);
    const bookingId = params.get("bookingId") || params.get("client_reference_id");
    if (bookingId) {
      // Redirect to hash-based success page to maintain navigation
      location.replace(`/#/success?bookingId=${encodeURIComponent(bookingId)}`);
      return;
    }
  }

  const route = (location.hash.replace(/^#\/?/, "") || "").split("?")[0];
  const [page, id] = route.split("/");

  if (page === "listings") return renderListings();
  if (page === "listing" && id) return renderDetail(id);
  if (page === "booking" && id) return renderBooking(id);
  if (page === "success") return renderSuccess(new URLSearchParams(location.hash.split("?")[1] || ""));
  if (page === "account") return renderAccount();
  if (page === "login") return renderLogin();
  if (page === "register") return renderRegister();
  if (page === "host") return renderHost();
  renderHome();
}

function renderHome() {
  app.innerHTML = `
    <div class="categories">
      <button class="category active" type="button" data-filter="all">
        <svg viewBox="0 0 24 24"><path d="M21.46 11.23l-8.5-8.08a2 2 0 00-2.75-.12l-.17.12-8.5 8.08a1 1 0 00-.33.68v9.59a2 2 0 002 2h4a2 2 0 002-2v-5a1 1 0 011-1h2a1 1 0 011 1v5a2 2 0 002 2h4a2 2 0 002-2v-9.59a1 1 0 00-.33-.68z"/></svg>
        <span>Tout</span>
      </button>
      <button class="category" type="button" data-filter="cabane">
        <svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16z"/></svg>
        <span>Cabanes</span>
      </button>
      <button class="category" type="button" data-filter="mer">
        <svg viewBox="0 0 24 24"><path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2z"/></svg>
        <span>Vue mer</span>
      </button>
    </div>
    <section class="section" style="padding-top:0">
      <div class="grid" id="listingGrid"></div>
    </section>
  `;
  renderCards(document.querySelector("#listingGrid"), listings);
  setupCategoryFilters();
}

function renderListings() {
  const query = new URLSearchParams(location.hash.split("?")[1] || "");
  app.innerHTML = `
    <section class="section">
      <div style="max-width:960px; margin:0 auto 32px">
        <h1 style="font-size:2rem; margin:0 0 16px">Logements calmes disponibles</h1>
        <form id="listingFilters" style="display:grid; grid-template-columns: 1fr 1fr 1fr auto; gap:12px; align-items:end">
          <div class="booking-inputs" style="margin:0">
            <div class="booking-input-cell" style="border-right:none">
              <label>Lieu</label>
              <input name="city" value="${escapeHtml(query.get("city") || "")}" placeholder="Annecy, Nice..." />
            </div>
          </div>
          <div class="booking-inputs" style="margin:0">
            <div class="booking-input-cell" style="border-right:none">
              <label>Prix max</label>
              <input name="maxPrice" type="number" min="0" value="${escapeHtml(query.get("maxPrice") || "")}" placeholder="170" />
            </div>
          </div>
          <div class="booking-inputs" style="margin:0">
            <div class="booking-input-cell" style="border-right:none">
              <label>Voyageurs</label>
              <input name="guests" type="number" min="1" value="${escapeHtml(query.get("guests") || "")}" placeholder="2" />
            </div>
          </div>
          <button class="primary-btn" type="submit" style="height:52px; width:auto; padding:0 22px">Rechercher</button>
        </form>
      </div>
      <div class="grid" id="listingGrid"></div>
    </section>
  `;

  const form = document.querySelector("#listingFilters");
  const renderFiltered = () => renderCards(document.querySelector("#listingGrid"), filterListings(new FormData(form)));
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    renderFiltered();
  });
  form.addEventListener("input", renderFiltered);
  renderFiltered();
}

function renderCards(target, items) {
  target.innerHTML = "";
  if (!items.length) {
    target.innerHTML = `<div class="empty">Aucun logement trouvé.</div>`;
    return;
  }
  items.forEach((listing) => {
    const node = template.content.cloneNode(true);
    
    const card = node.querySelector(".listing-card");
    card.addEventListener("click", () => {
      location.hash = `#/listing/${listing.id}`;
    });
    
    node.querySelector(".card-media-link").removeAttribute("href");
    
    const img = node.querySelector(".card-media");
    img.src = listing.image;
    img.alt = listing.title;
    
    node.querySelector(".city-title").textContent = `${listing.city}, France`;
    node.querySelector(".rating-val").textContent = listing.rating;
    
    node.querySelector(".distance").textContent = `${listing.title} · ${listing.guests} voyageurs`;
    node.querySelector(".dates").textContent = `${listing.noise} dB · ${listing.noise < 35 ? "moins de 35 dB" : "calme urbain"}`;
    
    node.querySelector(".price-val").textContent = euro.format(listing.price);
    
    const heartBtn = node.querySelector(".heart-btn");
    heartBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      heartBtn.querySelector("svg").style.fill = "var(--brand)";
      heartBtn.querySelector("svg").style.stroke = "var(--brand)";
    });

    target.appendChild(node);
  });
}

function setupCategoryFilters() {
  document.querySelectorAll(".category").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".category").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      const filter = button.dataset.filter;
      const filtered = listings.filter((listing) => {
        if (filter === "cabane") return listing.title.toLowerCase().includes("cabane") || listing.title.toLowerCase().includes("chalet");
        if (filter === "mer") return listing.city === "Nice" || listing.city === "Biarritz";
        return true;
      });
      renderCards(document.querySelector("#listingGrid"), filtered);
    });
  });
}

function filterListings(data) {
  const city = String(data.get("city") || "").trim().toLowerCase();
  const maxPrice = Number(data.get("maxPrice") || Infinity);
  const guests = Number(data.get("guests") || 0);
  return listings.filter((listing) => {
    const cityOk = !city || listing.city.toLowerCase().includes(city) || listing.title.toLowerCase().includes(city);
    const priceOk = !Number.isFinite(maxPrice) || listing.price <= maxPrice;
    const guestsOk = !guests || listing.guests >= guests;
    return cityOk && priceOk && guestsOk;
  });
}

function renderDetail(id) {
  const listing = getListing(id);
  if (!listing) return renderNotFound();
  app.innerHTML = `
    <section class="section">
      <div class="detail-title">
        <h1>${escapeHtml(listing.title)}</h1>
      </div>
      <div class="gallery">
        <img src="${listing.image}" alt="${escapeHtml(listing.title)}" />
        <img src="${listing.image}" alt="" />
        <img src="${listing.image}" alt="" />
      </div>
      <div class="detail-layout">
        <div class="detail-copy">
          <div class="detail-subtitle">
            ${listing.guests} voyageurs · 1 chambre · 1 lit · 1 salle de bain
          </div>
          <hr style="border:none; border-top:1px solid var(--line); margin: 24px 0" />
          <div style="display:flex; gap: 16px; margin-bottom:24px">
            <div>
               <svg viewBox="0 0 32 32" style="display:block;height:24px;width:24px;fill:currentColor"><path d="M16 2a14 14 0 100 28 14 14 0 000-28zm0 26a12 12 0 110-24 12 12 0 010 24z"/></svg>
            </div>
            <div>
              <div class="font-semibold">Logement très calme</div>
              <div class="muted">Niveau sonore moyen de ${listing.noise} dB.</div>
            </div>
          </div>
          <hr style="border:none; border-top:1px solid var(--line); margin: 24px 0" />
          <p style="font-size:1rem; line-height:1.6">${escapeHtml(listing.description)}</p>
          <hr style="border:none; border-top:1px solid var(--line); margin: 24px 0" />
          <h3>Ce que propose ce logement</h3>
          <ul style="padding-left: 20px; font-size:1rem; color:var(--ink); line-height: 2">
            ${listing.amenities.map(a => `<li>${escapeHtml(a)}</li>`).join("")}
          </ul>
        </div>
        <aside>
          <div class="booking-panel">
          <div class="booking-price">${euro.format(listing.price)} <span>par nuit</span></div>
            <form id="bookingForm">
              <div class="booking-inputs">
                <div class="booking-inputs-row">
                  <div class="booking-input-cell">
                    <label>Arrivée</label>
                    <input type="text" name="checkIn" required placeholder="jj/mm/aaaa" inputmode="numeric" />
                  </div>
                  <div class="booking-input-cell">
                    <label>Départ</label>
                    <input type="text" name="checkOut" required placeholder="jj/mm/aaaa" inputmode="numeric" />
                  </div>
                </div>
                <div class="booking-inputs-row">
                  <div class="booking-input-cell">
                    <label>Nom</label>
                    <input type="text" name="name" required placeholder="Votre nom" />
                  </div>
                  <div class="booking-input-cell">
                    <label>Email</label>
                    <input type="email" name="email" required placeholder="Email" />
                  </div>
                </div>
                <div class="booking-inputs-row" style="border-bottom:none">
                  <div class="booking-input-cell" style="border-right:none">
                    <label>Voyageurs</label>
                    <select name="guests">
                      ${guestOptions(listing.guests, 2)}
                    </select>
                  </div>
                </div>
                <div class="booking-inputs-row" style="border-bottom:none">
                  <div class="booking-input-cell" style="border-right:none">
                    <label>Code promo</label>
                    <input type="text" name="discountCode" placeholder="EARLYBIRD" />
                  </div>
                </div>
              </div>
              <button class="primary-btn" type="submit">Confirmer la réservation</button>
            </form>
            <div id="totalBox" style="margin-top:24px;"></div>
            <p id="bookingMessage" class="muted" style="margin-top:16px; text-align:center;" hidden></p>
            <a href="#/booking/${listing.id}" class="secondary-btn" style="margin-top:12px">Page réservation complète</a>
          </div>
        </aside>
      </div>
    </section>
  `;

  const form = document.querySelector("#bookingForm");
  const totalBox = document.querySelector("#totalBox");
  const update = () => {
    const data = new FormData(form);
    const checkIn = data.get("checkIn");
    const checkOut = data.get("checkOut");
    const nights = nightsBetween(checkIn, checkOut);
    if (nights > 0) {
      const subtotal = nights * listing.price;
      const discount = String(data.get("discountCode") || "").trim().toUpperCase() === "EARLYBIRD" ? Math.round(subtotal * 0.1) : 0;
      const total = subtotal - discount;
      totalBox.innerHTML = `
        <div class="total-line"><span>${euro.format(listing.price)} x ${nights} nuits</span><span>${euro.format(subtotal)}</span></div>
        <div class="total-line"><span>Code EARLYBIRD</span><span>-${euro.format(discount)}</span></div>
        <div class="total-line bold"><span>Total</span><span>${euro.format(total)}</span></div>
      `;
    } else {
      totalBox.innerHTML = "";
    }
  };
  form.addEventListener("input", update);
  form.addEventListener("submit", (event) => submitBooking(event, listing));
  setupDateInputs(form);
}

function renderBooking(id) {
  const listing = getListing(id);
  if (!listing) return renderNotFound();
  if (supabaseConfigured && !currentUser) {
    app.innerHTML = `
      <section class="section">
        <div class="detail-layout">
          <div>
            <div class="detail-title">
              <h1>Réserver ${escapeHtml(listing.title)}</h1>
            </div>
            <div class="gallery">
              <img src="${listing.image}" alt="${escapeHtml(listing.title)}" />
              <img src="${listing.image}" alt="" />
              <img src="${listing.image}" alt="" />
            </div>
          </div>
          <aside>
            <div class="booking-panel">
              <div class="booking-price">Compte requis</div>
              <p class="muted" style="margin-bottom:20px">Vous devez avoir un compte ZenStay pour louer ce logement.</p>
              <a class="primary-btn" href="#/account">Se connecter ou créer un compte</a>
            </div>
          </aside>
        </div>
      </section>
    `;
    return;
  }
  const query = new URLSearchParams(location.hash.split("?")[1] || "");
  app.innerHTML = `
    <section class="section">
      <div class="detail-layout">
        <div>
          <div class="detail-title">
            <h1>Réserver ${escapeHtml(listing.title)}</h1>
          </div>
          <div class="gallery">
            <img src="${listing.image}" alt="${escapeHtml(listing.title)}" />
            <img src="${listing.image}" alt="" />
            <img src="${listing.image}" alt="" />
          </div>
          <p class="muted" style="font-size:1rem">${escapeHtml(listing.city)} · ${listing.guests} voyageurs · ${listing.noise} dB · ${listing.rating}/5</p>
        </div>
        <aside>
          <div class="booking-panel">
            <div class="booking-price">${euro.format(listing.price)} <span>par nuit</span></div>
            <form id="bookingForm">
              <div class="booking-inputs">
                <div class="booking-inputs-row">
                  <div class="booking-input-cell">
                    <label>Arrivée</label>
                    <input type="text" name="checkIn" required placeholder="jj/mm/aaaa" inputmode="numeric" value="${escapeHtml(toDisplayDate(query.get("checkIn") || ""))}" />
                  </div>
                  <div class="booking-input-cell">
                    <label>Départ</label>
                    <input type="text" name="checkOut" required placeholder="jj/mm/aaaa" inputmode="numeric" value="${escapeHtml(toDisplayDate(query.get("checkOut") || ""))}" />
                  </div>
                </div>
                <div class="booking-inputs-row">
                  <div class="booking-input-cell">
                    <label>Nom</label>
                    <input type="text" name="name" required placeholder="Votre nom" />
                  </div>
                  <div class="booking-input-cell">
                    <label>Email</label>
                    <input type="email" name="email" required placeholder="Email" />
                  </div>
                </div>
                <div class="booking-inputs-row">
                  <div class="booking-input-cell">
                    <label>Voyageurs</label>
                    <select name="guests">${guestOptions(listing.guests, Number(query.get("guests") || 2))}</select>
                  </div>
                  <div class="booking-input-cell" style="border-right:none">
                    <label>Code promo</label>
                    <input type="text" name="discountCode" placeholder="EARLYBIRD" />
                  </div>
                </div>
              </div>
              <button class="primary-btn" type="submit">Confirmer la réservation</button>
            </form>
            <div id="totalBox" style="margin-top:24px;"></div>
            <p id="bookingMessage" class="muted" style="margin-top:16px; text-align:center;" hidden></p>
          </div>
        </aside>
      </div>
    </section>
  `;

  const form = document.querySelector("#bookingForm");
  const totalBox = document.querySelector("#totalBox");
  const update = () => updateTotalBox(form, listing, totalBox);
  form.addEventListener("input", update);
  form.addEventListener("submit", (event) => submitBooking(event, listing));
  setupDateInputs(form);
  update();
}

function updateTotalBox(form, listing, totalBox) {
  const data = new FormData(form);
  const nights = nightsBetween(data.get("checkIn"), data.get("checkOut"));
  if (nights < 1) {
    totalBox.innerHTML = `<p class="muted" style="text-align:center">Choisissez vos dates pour calculer le prix total.</p>`;
    return;
  }
  const subtotal = nights * listing.price;
  const discount = String(data.get("discountCode") || "").trim().toUpperCase() === "EARLYBIRD" ? Math.round(subtotal * 0.1) : 0;
  const total = subtotal - discount;
  totalBox.innerHTML = `
    <div class="total-line"><span>${euro.format(listing.price)} x ${nights} nuits</span><span>${euro.format(subtotal)}</span></div>
    <div class="total-line"><span>Code EARLYBIRD</span><span>-${euro.format(discount)}</span></div>
    <div class="total-line bold"><span>Total</span><span>${euro.format(total)}</span></div>
  `;
}

function guestOptions(maxGuests, selected) {
  const optionCount = Math.max(20, Number(maxGuests) || 1);
  return Array.from({ length: optionCount }, (_, index) => {
    const value = index + 1;
    return `<option value="${value}" ${value === selected ? "selected" : ""}>${value} voyageur${value > 1 ? "s" : ""}</option>`;
  }).join("");
}

async function submitBooking(event, listing) {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector("button[type='submit']");
  const message = document.querySelector("#bookingMessage");
  const payload = Object.fromEntries(new FormData(form).entries());
  payload.listingId = listing.id;
  const nights = nightsBetween(payload.checkIn, payload.checkOut);
  if (nights < 1) {
    message.hidden = false;
    message.textContent = "Dates invalides. Utilisez le format jj/mm/aaaa, par exemple 15/07/2026.";
    return;
  }
  const headers = await authHeaders();
  if (supabaseConfigured && !headers.Authorization) {
    message.hidden = false;
    message.innerHTML = `Vous devez avoir un compte pour louer ce logement.<br><a class="secondary-btn" style="margin-top:12px" href="#/account">Se connecter</a>`;
    return;
  }
  button.disabled = true;
  button.textContent = "Envoi...";
  message.hidden = true;

  try {
    const response = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Réservation impossible");
    currentBooking = data.booking;
    localStorage.setItem("zenstay-last-booking", JSON.stringify(data.booking));
    message.hidden = false;
    message.textContent = `Réservation créée. Redirection vers Stripe pour payer ${euro.format(data.booking.total)}...`;
    await payBooking(data.booking.id, message);
  } catch (error) {
    message.hidden = false;
    message.textContent = error.message;
  } finally {
    button.disabled = false;
    button.textContent = "Confirmer la réservation";
  }
}

async function payBooking(bookingId, messageEl = null) {
  const headers = await authHeaders();
  const response = await fetch("/api/create-checkout-session", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify({ bookingId })
  });
  const data = await response.json();
  if (!response.ok) {
    const errorMessage = data.error || "Paiement indisponible";
    if (messageEl) throw new Error(errorMessage);
    alert(errorMessage);
    return false;
  }
  window.location.href = data.url;
  return true;
}

async function renderSuccess(params) {
  const bookingId = params.get("bookingId");
  let booking = currentBooking || readLastBooking();
  if (bookingId) {
    try {
      const headers = await authHeaders();
      if (headers.Authorization) {
        await fetch(`/api/bookings/${encodeURIComponent(bookingId)}/mark-paid`, {
          method: "POST",
          headers
        });
      }
      const response = await fetch(`/api/bookings/${encodeURIComponent(bookingId)}`, { headers });
      const data = await response.json();
      if (data.booking) booking = data.booking;
    } catch {
      // ignore
    }
  }

  app.innerHTML = `
    <section class="section">
      <div style="max-width:600px; margin:0 auto; padding:40px 24px; text-align:center">
        <svg viewBox="0 0 24 24" style="width: 64px; height: 64px; margin: 0 auto 24px; fill: var(--brand);">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
        </svg>
        <h2 style="font-size: 2rem; margin: 0 0 12px;">Voyage confirmé</h2>
        <p class="muted" style="margin-bottom:32px">Votre réservation est finalisée. Carte test Stripe : 4242 4242 4242 4242.</p>
        ${booking ? `
        <div style="border:1px solid var(--line); border-radius:12px; padding:24px; text-align:left; margin-bottom:32px">
          <div class="total-line"><span>Nom</span><strong>${escapeHtml(booking.name)}</strong></div>
          <div class="total-line"><span>Email</span><strong>${escapeHtml(booking.email)}</strong></div>
          <div class="total-line"><span>Logement</span><strong>${escapeHtml(booking.listingTitle)}</strong></div>
          <div class="total-line"><span>Ville</span><strong>${escapeHtml(booking.city)}</strong></div>
          <div class="total-line"><span>Dates</span><strong>${escapeHtml(booking.checkIn)} au ${escapeHtml(booking.checkOut)}</strong></div>
          <div class="total-line"><span>Voyageurs</span><strong>${booking.guests}</strong></div>
          <div class="total-line"><span>Statut</span><strong>${booking.paymentStatus === "paid" ? "Payé" : "En attente"}</strong></div>
          <div class="total-line"><span>Total</span><strong>${euro.format(booking.total)}</strong></div>
        </div>
        ` : ""}
        <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
          <button class="secondary-btn" type="button" onclick="window.print()" style="min-width: 200px;">PDF de confirmation</button>
          <a class="primary-btn" href="#/" style="min-width: 200px;">Retour à l'accueil</a>
          <a class="secondary-btn" href="#/listings" style="min-width: 200px;">Voir tous les logements</a>
        </div>
      </div>
    </section>
  `;
}

function renderHost() {
  if (supabaseConfigured && !currentUser) {
    app.innerHTML = `
      <section class="section">
        <div style="max-width:560px; margin:0 auto; text-align:center; padding:60px 24px">
          <h1 style="font-size:2.5rem; margin:0 0 20px">Connexion requise</h1>
          <p class="muted" style="font-size:1.1rem; margin-bottom:28px">Vous devez avoir un compte ZenStay pour ajouter un logement hôte.</p>
          <a class="primary-btn" href="#/account">Se connecter ou créer un compte</a>
        </div>
      </section>
    `;
    return;
  }

  app.innerHTML = `
    <section class="section">
      <div class="detail-layout">
        <div>
          <h1 style="font-size:3rem; margin:0 0 24px">Ouvrez votre porte ZenStay</h1>
          <p class="muted" style="font-size:1.25rem; margin-bottom:24px">Ajoutez un logement calme au catalogue. Il sera sauvegardé localement et visible immédiatement sur le site.</p>
          <div style="border:1px solid var(--line); border-radius:12px; padding:24px">
            <div class="total-line"><span>Compte</span><strong>${currentUser?.email ? escapeHtml(currentUser.email) : "Mode invité"}</strong></div>
            <div class="total-line"><span>Sauvegarde</span><strong>${supabaseConfigured ? "Supabase" : "data/listings.json"}</strong></div>
            <div class="total-line"><span>Limite voyageurs</span><strong>20 maximum</strong></div>
          </div>
        </div>
        <aside>
          <div class="booking-panel">
            <div class="booking-price">Nouveau logement</div>
            <form id="hostForm">
              <div class="booking-inputs">
                <div class="booking-inputs-row">
                  <div class="booking-input-cell">
                    <label>Titre</label>
                    <input name="title" required placeholder="Loft silencieux à Lyon" />
                  </div>
                </div>
                <div class="booking-inputs-row">
                  <div class="booking-input-cell">
                    <label>Ville</label>
                    <input name="city" required placeholder="Lyon" />
                  </div>
                  <div class="booking-input-cell">
                    <label>Prix / nuit</label>
                    <input name="price" required type="number" min="1" placeholder="110" />
                  </div>
                </div>
                <div class="booking-inputs-row">
                  <div class="booking-input-cell">
                    <label>Voyageurs</label>
                    <input name="guests" required type="number" min="1" max="20" value="4" />
                  </div>
                  <div class="booking-input-cell">
                    <label>dB</label>
                    <input name="noise" type="number" min="20" max="70" value="32" />
                  </div>
                </div>
                <div class="booking-inputs-row">
                  <div class="booking-input-cell" style="border-right:none">
                    <label>Image</label>
                    <input name="imageFile" type="file" accept="image/png,image/jpeg,image/webp" required />
                  </div>
                </div>
                <div class="booking-inputs-row">
                  <div class="booking-input-cell" style="border-right:none">
                    <label>Description</label>
                    <input name="description" required placeholder="Logement calme avec double vitrage..." />
                  </div>
                </div>
                <div class="booking-inputs-row">
                  <div class="booking-input-cell" style="border-right:none">
                    <label>Équipements</label>
                    <input name="amenities" placeholder="Wifi, Cuisine, Parking" />
                  </div>
                </div>
              </div>
              <input type="hidden" name="hostEmail" value="${escapeHtml(currentUser?.email || "")}" />
              <button class="primary-btn" type="submit">Ajouter mon logement</button>
            </form>
            <p id="hostMessage" class="muted" style="margin-top:16px; text-align:center" hidden></p>
          </div>
        </aside>
      </div>
    </section>
  `;
  document.querySelector("#hostForm").addEventListener("submit", submitHostListing);
}

async function submitHostListing(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector("button[type='submit']");
  const message = document.querySelector("#hostMessage");
  button.disabled = true;
  button.textContent = "Ajout...";
  message.hidden = true;

  try {
    const headers = await authHeaders();
    if (supabaseConfigured && !headers.Authorization) {
      throw new Error("Vous devez etre connecte pour ajouter un logement hote");
    }
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    const file = formData.get("imageFile");
    if (!(file instanceof File) || !file.size) {
      throw new Error("Ajoutez une image en piece jointe");
    }
    payload.image = await uploadListingImage(file);
    delete payload.imageFile;
    const response = await fetch("/api/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Ajout impossible");
    listings = await fetchListings();
    message.hidden = false;
    message.innerHTML = `Logement ajouté.<br><a class="secondary-btn" style="margin-top:12px" href="#/listing/${data.listing.id}">Voir le logement</a>`;
    form.reset();
  } catch (error) {
    message.hidden = false;
    message.textContent = error.message;
  } finally {
    button.disabled = false;
    button.textContent = "Ajouter mon logement";
  }
}

async function uploadListingImage(file) {
  if (supabaseConfigured && !supabaseClient) {
    throw new Error("Supabase Storage n'est pas encore prêt. Réessayez dans quelques secondes.");
  }
  if (!supabaseClient) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("Image illisible"));
      reader.readAsDataURL(file);
    });
  }

  const { data } = await supabaseClient.auth.getUser();
  const userId = data.user?.id;
  if (!userId) throw new Error("Connexion requise pour envoyer l'image");
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeName = file.name
    .replace(/\.[^.]+$/, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "logement";
  const path = `${userId}/${Date.now()}-${safeName}.${extension}`;
  const { error } = await supabaseClient.storage.from("listing-images").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type
  });
  if (error) throw error;
  const { data: publicData } = supabaseClient.storage.from("listing-images").getPublicUrl(path);
  return publicData.publicUrl;
}

async function renderAccount() {
  if (!currentUser) return renderLogin();

  app.innerHTML = `
    <section class="section">
      <div style="max-width:800px; margin:0 auto">
        <h1 style="font-size:2rem; margin:0 0 24px">Profil de ${escapeHtml(currentUser.email)}</h1>
        <div style="display: grid; gap: 32px;">
          <div class="booking-panel" style="position:static">
            <h2 style="font-size:1.5rem; margin:0 0 16px">Informations</h2>
            <div style="border:1px solid var(--line); border-radius:12px; padding:20px; margin-bottom:16px">
              <div class="total-line"><span>Email</span><strong>${escapeHtml(currentUser.email)}</strong></div>
              <div class="total-line"><span>Mode</span><strong>${supabaseConfigured ? "Supabase" : "Local demo"}</strong></div>
            </div>
            <button class="secondary-btn" id="logoutButton" type="button" style="max-width:200px">Se déconnecter</button>
          </div>
          
          <div id="accountDataContainer">
             <p class="muted">Chargement de vos données...</p>
          </div>
        </div>
      </div>
    </section>
  `;
  document.querySelector("#logoutButton")?.addEventListener("click", logoutAccount);

  try {
    const res = await fetch(`/api/account/data?email=${encodeURIComponent(currentUser.email)}`);
    if (!res.ok) throw new Error("Erreur de chargement");
    const data = await res.json();
    
    const container = document.querySelector("#accountDataContainer");
    if (!container) return;

    let html = "";
    
    // Bookings
    html += `<h2 style="font-size:1.5rem; margin:0 0 16px">Mes voyages (${data.bookings.length})</h2>`;
    if (data.bookings.length > 0) {
      html += `<div style="display:grid; gap:16px; margin-bottom:32px">`;
      data.bookings.forEach(b => {
        const statusBadge = b.paymentStatus === "paid"
          ? '<span style="background: #e8f5e9; color: #2e7d32; padding: 4px 12px; border-radius: 12px; font-size: 0.875rem; font-weight: 600;">Payé</span>'
          : '<span style="background: #fff3e0; color: #e65100; padding: 4px 12px; border-radius: 12px; font-size: 0.875rem; font-weight: 600;">En attente</span>';
        html += `
          <div style="border:1px solid var(--line); border-radius:12px; padding:20px; cursor: pointer;" onclick="location.hash='#/listing/${escapeHtml(b.listingId)}'">
            <div style="display:flex; justify-content:space-between; align-items: center; margin-bottom:8px">
              <strong style="font-size:1.1rem">${escapeHtml(b.listingTitle)}</strong>
              <div style="display: flex; align-items: center; gap: 12px;">
                ${statusBadge}
                <span class="muted">${euro.format(b.total)}</span>
              </div>
            </div>
            <p class="muted" style="margin:0">${escapeHtml(b.city)} · ${b.checkIn} au ${b.checkOut} · ${b.guests} voyageur(s)</p>
          </div>
        `;
      });
      html += `</div>`;
    } else {
      html += `<p class="muted" style="margin-bottom:32px">Vous n'avez pas encore réservé de voyage. <a href="#/listings" style="color:var(--brand); font-weight:600;">Découvrir nos logements</a></p>`;
    }

    // Listings
    html += `<h2 style="font-size:1.5rem; margin:0 0 16px">Mes annonces (${data.listings.length})</h2>`;
    if (data.listings.length > 0) {
      html += `<div style="display:grid; gap:16px;">`;
      data.listings.forEach(l => {
        html += `
          <div style="border:1px solid var(--line); border-radius:12px; padding:20px; display:flex; gap:16px; align-items:center; cursor: pointer;" onclick="location.hash='#/listing/${escapeHtml(l.id)}'">
            <img src="${l.image}" style="width:80px; height:80px; border-radius:8px; object-fit:cover" alt="${escapeHtml(l.title)}" />
            <div style="flex: 1;">
              <strong style="font-size:1.1rem; display:block; margin-bottom:4px">${escapeHtml(l.title)}</strong>
              <p class="muted" style="margin:0">${escapeHtml(l.city)} · ${euro.format(l.price)}/nuit · ${l.guests} voyageurs · ${l.noise} dB</p>
            </div>
            <div style="text-align: right;">
              <div style="display: flex; align-items: center; gap: 4px; color: var(--ink);">
                <svg viewBox="0 0 32 32" style="display: block; height: 14px; width: 14px; fill: currentColor;">
                  <path d="M15.094 1.579l-4.124 8.885-9.86 1.27a1 1 0 0 0-.542 1.736l7.293 6.565-1.965 9.852a1 1 0 0 0 1.483 1.061L16 25.951l8.625 4.997a1 1 0 0 0 1.482-1.06l-1.965-9.853 7.293-6.565a1 1 0 0 0-.541-1.735l-9.86-1.271-4.127-8.885a1 1 0 0 0-1.814 0z"/>
                </svg>
                <span style="font-weight: 600;">${l.rating}</span>
              </div>
            </div>
          </div>
        `;
      });
      html += `</div>`;
    } else {
      html += `<p class="muted">Vous n'hébergez aucun logement. <a href="#/host" style="color:var(--brand); font-weight:600;">Devenir hôte</a></p>`;
    }

    container.innerHTML = html;
  } catch (err) {
    const container = document.querySelector("#accountDataContainer");
    if (container) container.innerHTML = `<p class="muted">Impossible de charger vos données.</p>`;
  }
}

function renderLogin() {
  if (currentUser) return renderAccount();

  app.innerHTML = `
    <section class="section">
      <div style="max-width:520px; margin:0 auto">
        <h1 style="font-size:2rem; margin:0 0 24px">Connexion</h1>
        <div class="booking-panel" style="position:static">
          <form id="accountForm">
            <div class="booking-inputs">
              <div class="booking-inputs-row">
                <div class="booking-input-cell" style="border-right:none">
                  <label>Email</label>
                  <input name="email" type="email" autocomplete="email" required placeholder="vous@email.com" />
                </div>
              </div>
              <div class="booking-inputs-row" style="border-bottom:none">
                <div class="booking-input-cell" style="border-right:none">
                  <label>Mot de passe</label>
                  <input name="password" type="password" autocomplete="current-password" required placeholder="Minimum 6 caractères" />
                </div>
              </div>
            </div>
            <button class="primary-btn" name="mode" value="signin" type="submit">Se connecter</button>
          </form>
          <p style="margin-top:16px; text-align:center">Pas de compte ? <a href="#/register" style="color:var(--brand); font-weight:600">Inscrivez-vous</a></p>
          <p id="accountMessage" class="muted" style="margin-top:16px; text-align:center">${supabaseConfigured ? "Supabase est configuré." : "Supabase non configuré : compte local de démonstration."}</p>
        </div>
      </div>
    </section>
  `;
  document.querySelector("#accountForm")?.addEventListener("submit", submitAccount);
}

function renderRegister() {
  if (currentUser) return renderAccount();

  app.innerHTML = `
    <section class="section">
      <div style="max-width:520px; margin:0 auto">
        <h1 style="font-size:2rem; margin:0 0 24px">Créer un compte</h1>
        <div class="booking-panel" style="position:static">
          <form id="accountForm">
            <div class="booking-inputs">
              <div class="booking-inputs-row">
                <div class="booking-input-cell" style="border-right:none">
                  <label>Email</label>
                  <input name="email" type="email" autocomplete="email" required placeholder="vous@email.com" />
                </div>
              </div>
              <div class="booking-inputs-row" style="border-bottom:none">
                <div class="booking-input-cell" style="border-right:none">
                  <label>Mot de passe</label>
                  <input name="password" type="password" autocomplete="new-password" required placeholder="Minimum 6 caractères" />
                </div>
              </div>
            </div>
            <button class="primary-btn" name="mode" value="signup" type="submit">S'inscrire</button>
          </form>
          <p style="margin-top:16px; text-align:center">Déjà un compte ? <a href="#/login" style="color:var(--brand); font-weight:600">Connectez-vous</a></p>
          <p id="accountMessage" class="muted" style="margin-top:16px; text-align:center">${supabaseConfigured ? "Supabase est configuré." : "Supabase non configuré : compte local de démonstration."}</p>
        </div>
      </div>
    </section>
  `;
  document.querySelector("#accountForm")?.addEventListener("submit", submitAccount);
}

async function submitAccount(event) {
  event.preventDefault();
  const submitter = event.submitter;
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form).entries());
  const message = document.querySelector("#accountMessage");
  const mode = submitter?.value || "signin";
  try {
    if (supabaseConfigured && !supabaseClient) {
      throw new Error("Supabase est configuré, mais la librairie d'authentification n'a pas encore chargé. Réessayez dans quelques secondes.");
    }
    if (supabaseClient) {
      const result = mode === "signup"
        ? await supabaseClient.auth.signUp({ email: data.email, password: data.password })
        : await supabaseClient.auth.signInWithPassword({ email: data.email, password: data.password });
      if (result.error) throw result.error;
      if (!result.data.session?.access_token) {
        currentUser = null;
        updateAccountLink();
        message.textContent = mode === "signup"
          ? "Compte créé. Confirmez votre email si Supabase vous le demande, puis connectez-vous."
          : "Connexion sans session active. Vérifiez votre email ou vos identifiants.";
        return;
      }
      currentUser = result.data.session.user;
    } else {
      currentUser = { email: data.email, local: true };
      localStorage.setItem("zenstay-user", JSON.stringify(currentUser));
    }
    updateAccountLink();
    location.hash = "#/account";
    await render();
  } catch (error) {
    message.textContent = error.message || "Connexion impossible";
  }
}

async function logoutAccount() {
  if (supabaseClient) await supabaseClient.auth.signOut();
  localStorage.removeItem("zenstay-user");
  currentUser = null;
  updateAccountLink();
  location.hash = "#/login";
  await render();
}

function renderNotFound() {
  app.innerHTML = `<section class="section"><h2 style="text-align:center">Page introuvable</h2></section>`;
}

function getListing(id) {
  return listings.find((listing) => listing.id === id);
}

function nightsBetween(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0;
  const start = parseDateInput(checkIn);
  const end = parseDateInput(checkOut);
  const nights = Math.round((end - start) / 86400000);
  return Number.isFinite(nights) && nights > 0 ? nights : 0;
}

function parseDateInput(value) {
  const raw = String(value || "").trim();
  const compact = raw.match(/^(\d{2})(\d{2})(\d{4})$/);
  if (compact) return new Date(`${compact[3]}-${compact[2]}-${compact[1]}T12:00:00`);
  const french = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (french) return new Date(`${french[3]}-${french[2]}-${french[1]}T12:00:00`);
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return new Date(`${iso[1]}-${iso[2]}-${iso[3]}T12:00:00`);
  return new Date("invalid");
}

function toDisplayDate(value) {
  const raw = String(value || "").trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) return raw;
  const compact = raw.match(/^(\d{2})(\d{2})(\d{4})$/);
  if (compact) return `${compact[1]}/${compact[2]}/${compact[3]}`;
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return iso ? `${iso[3]}/${iso[2]}/${iso[1]}` : raw;
}

function setupDateInputs(scope) {
  scope.querySelectorAll("input[name='checkIn'], input[name='checkOut']").forEach((input) => {
    input.addEventListener("input", () => {
      const digits = input.value.replace(/\D/g, "").slice(0, 8);
      if (digits.length <= 2) {
        input.value = digits;
      } else if (digits.length <= 4) {
        input.value = `${digits.slice(0, 2)}/${digits.slice(2)}`;
      } else {
        input.value = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
      }
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
  });
}

function readLastBooking() {
  try {
    return JSON.parse(localStorage.getItem("zenstay-last-booking") || "null");
  } catch {
    return null;
  }
}

function readLocalUser() {
  try {
    return JSON.parse(localStorage.getItem("zenstay-user") || "null");
  } catch {
    return null;
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function submitNewsletter(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector("button[type='submit']");
  const message = document.querySelector("#newsletterMessage");
  const emailInput = form.querySelector("input[name='email']");
  const email = emailInput.value.trim();

  if (!email) {
    message.hidden = false;
    message.textContent = "Veuillez entrer une adresse email valide.";
    message.style.color = "var(--error, #d32f2f)";
    return;
  }

  button.disabled = true;
  const originalText = button.textContent;
  button.textContent = "Inscription...";
  message.hidden = true;

  try {
    const response = await fetch("https://n8n.fatonfaton.fr/webhook/6cccda76-7cba-42dc-8bbc-ebbd4ddd313b", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    if (!response.ok) {
      throw new Error("Erreur lors de l'inscription à la newsletter");
    }

    message.hidden = false;
    message.textContent = "Merci ! Vous êtes inscrit(e) à notre newsletter.";
    message.style.color = "var(--success, #2e7d32)";
    form.reset();
  } catch (error) {
    message.hidden = false;
    message.textContent = error.message || "Une erreur est survenue. Réessayez plus tard.";
    message.style.color = "var(--error, #d32f2f)";
  } finally {
    button.disabled = false;
    button.textContent = originalText;
  }
}
