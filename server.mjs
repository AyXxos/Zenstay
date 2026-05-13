import { createServer } from "node:http";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
await loadEnvFile(join(__dirname, ".env"));

const publicDir = join(__dirname, "public");
const dataDir = join(__dirname, "data");
const bookingsFile = join(dataDir, "bookings.json");
const listingsFile = join(dataDir, "listings.json");
const PORT = Number(process.env.PORT || 3000);

async function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  const content = await readFile(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

const defaultListings = [
  {
    id: "villa-biarritz",
    title: "Villa calme a Biarritz",
    city: "Biarritz",
    price: 120,
    guests: 4,
    noise: 32,
    rating: 4.9,
    image:
      "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=1400&q=80",
    description:
      "Une villa lumineuse a dix minutes de l'ocean, isolee des axes passants et pensee pour des sejours reposants.",
    amenities: ["Jardin prive", "Cuisine equipee", "Parking", "Espace yoga", "Wifi fibre"],
    reviews: [
      "Silence rare pour Biarritz, parfait pour teletravailler.",
      "Tres belle lumiere et nuits vraiment calmes."
    ]
  },
  {
    id: "studio-annecy",
    title: "Studio zen a Annecy",
    city: "Annecy",
    price: 85,
    guests: 2,
    noise: 30,
    rating: 4.8,
    image:
      "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1400&q=80",
    description:
      "Un cocon minimaliste proche du lac, avec double vitrage, literie premium et ambiance apaisante.",
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
    image:
      "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=1400&q=80",
    description:
      "Maison familiale au bord des pins, grande terrasse ombragee et pieces fraiches pour ralentir le rythme.",
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
    image:
      "https://images.unsplash.com/photo-1482192505345-5655af888cc4?auto=format&fit=crop&w=1400&q=80",
    description:
      "Cabane en bois avec poele, grande baie vitree et sentier prive au coeur d'un domaine forestier.",
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
    image:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80",
    description:
      "Appartement aerien sur une rue residentielle, balcon mer et chambres cote cour pour des nuits paisibles.",
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
    image:
      "https://images.unsplash.com/photo-1518732714860-b62714ce0c59?auto=format&fit=crop&w=1400&q=80",
    description:
      "Chalet chaleureux avec vue sur les sommets, sauna, coin lecture et isolation acoustique renforcee.",
    amenities: ["Sauna", "Cheminee", "Local ski", "Cuisine ouverte", "Coin lecture"],
    reviews: ["Le chalet est aussi calme que beau.", "Tres confortable apres les randonnees."]
  }
];

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp"
};

await ensureStorage();

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (req.method === "GET" && url.pathname === "/api/config") {
      return sendJson(res, {
        supabaseUrl: process.env.SUPABASE_URL || "",
        supabaseAnonKey: process.env.SUPABASE_ANON_KEY || ""
      });
    }

    if (req.method === "GET" && url.pathname === "/api/listings") {
      const listings = await readListings();
      return sendJson(res, { listings });
    }

    if (req.method === "POST" && url.pathname === "/api/listings") {
      return createListing(req, res);
    }

    if (req.method === "GET" && url.pathname === "/api/account/data") {
      const email = url.searchParams.get("email");
      if (!email) return sendJson(res, { error: "Email requis" }, 400);
      
      const allBookings = await readBookings();
      const allListings = await readListings();
      
      const userBookings = allBookings.filter(b => b.email === email);
      const userListings = allListings.filter(l => l.hostEmail === email);
      
      return sendJson(res, { bookings: userBookings, listings: userListings });
    }

    if (req.method === "POST" && url.pathname === "/api/bookings") {
      return createBooking(req, res);
    }

    if (req.method === "GET" && url.pathname.startsWith("/api/bookings/")) {
      const id = decodeURIComponent(url.pathname.split("/").pop());
      const booking = await findBookingById(id, req);
      return booking ? sendJson(res, { booking }) : sendJson(res, { error: "Reservation introuvable" }, 404);
    }

    if (req.method === "POST" && url.pathname.match(/^\/api\/bookings\/[^/]+\/mark-paid$/)) {
      const id = decodeURIComponent(url.pathname.split("/")[3]);
      if (isSupabaseConfigured() && !getBearerToken(req)) {
        return sendJson(res, { error: "Connexion requise" }, 401);
      }
      await markBookingPaid(id, req);
      return sendJson(res, { ok: true });
    }

    if (req.method === "POST" && url.pathname === "/api/create-checkout-session") {
      return createCheckoutSession(req, res);
    }

    if (req.method === "POST" && url.pathname === "/api/send-invoice") {
      return sendInvoiceToN8n(req, res);
    }

    if (req.method === "GET" && url.pathname === "/success") {
      const bookingId = url.searchParams.get("bookingId") || url.searchParams.get("client_reference_id");
      if (bookingId && !isSupabaseConfigured()) await markBookingPaid(bookingId);
      return serveFile(res, join(publicDir, "index.html"));
    }

    if (req.method === "GET") {
      return serveStatic(url.pathname, res);
    }

    sendJson(res, { error: "Methode non supportee" }, 405);
  } catch (error) {
    console.error(error);
    sendJson(res, { error: "Erreur serveur" }, 500);
  }
}).listen(PORT, () => {
  console.log(`ZenStay tourne sur http://localhost:${PORT}`);
});

async function ensureStorage() {
  await mkdir(dataDir, { recursive: true });
  if (!existsSync(bookingsFile)) {
    await writeFile(bookingsFile, "[]\n", "utf8");
  }
  if (!existsSync(listingsFile)) {
    await writeFile(listingsFile, `${JSON.stringify(defaultListings, null, 2)}\n`, "utf8");
  }
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

async function readBookings() {
  await ensureStorage();
  const content = await readFile(bookingsFile, "utf8");
  try {
    return JSON.parse(content);
  } catch {
    return [];
  }
}

async function saveBookings(bookings) {
  await writeFile(bookingsFile, `${JSON.stringify(bookings, null, 2)}\n`, "utf8");
}

async function findBookingById(id, req) {
  if (isSupabaseConfigured()) {
    const token = getBearerToken(req);
    if (!token) return null;
    const rows = await supabaseRequest(`/rest/v1/bookings?select=*&id=eq.${encodeURIComponent(id)}&limit=1`, { token });
    return rows[0] ? mapBookingFromDb(rows[0]) : null;
  }
  const bookings = await readBookings();
  return bookings.find((item) => item.id === id) || null;
}

async function readListings() {
  if (isSupabaseConfigured()) {
    const rows = await supabaseRequest("/rest/v1/listings?select=*&order=created_at.desc");
    return rows.map(mapListingFromDb);
  }
  await ensureStorage();
  const content = await readFile(listingsFile, "utf8");
  try {
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) && parsed.length ? parsed : defaultListings;
  } catch {
    return defaultListings;
  }
}

async function saveListings(listings) {
  await writeFile(listingsFile, `${JSON.stringify(listings, null, 2)}\n`, "utf8");
}

function isSupabaseConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
}

function getBearerToken(req) {
  const header = req.headers.authorization || "";
  return header.startsWith("Bearer ") ? header.slice(7) : "";
}

async function getSupabaseUser(req) {
  if (!isSupabaseConfigured()) return null;
  const token = getBearerToken(req);
  if (!token) return null;
  const response = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: process.env.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`
    }
  });
  if (!response.ok) return null;
  return response.json();
}

async function supabaseRequest(path, options = {}) {
  const token = options.token || process.env.SUPABASE_ANON_KEY;
  const response = await fetch(`${process.env.SUPABASE_URL}${path}`, {
    method: options.method || "GET",
    headers: {
      apikey: process.env.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.prefer ? { Prefer: options.prefer } : {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Supabase ${response.status}`);
  }
  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

function mapListingFromDb(row) {
  return {
    id: row.id,
    title: row.title,
    city: row.city,
    price: row.price,
    guests: row.guests,
    noise: row.noise,
    rating: Number(row.rating),
    image: row.image,
    description: row.description,
    amenities: row.amenities || [],
    reviews: row.reviews || [],
    hostId: row.host_id,
    hostEmail: row.host_email,
    createdAt: row.created_at
  };
}

function mapBookingFromDb(row) {
  return {
    id: row.id,
    createdAt: row.created_at,
    userId: row.user_id,
    name: row.name,
    email: row.email,
    listingId: row.listing_id,
    listingTitle: row.listing_title,
    city: row.city,
    checkIn: row.check_in,
    checkOut: row.check_out,
    guests: row.guests,
    nights: row.nights,
    pricePerNight: row.price_per_night,
    subtotal: row.subtotal,
    discountCode: row.discount_code || "",
    discount: row.discount,
    total: row.total,
    paymentStatus: row.payment_status,
    paidAt: row.paid_at
  };
}

function parseDateInput(value) {
  const raw = String(value || "").trim();
  const compact = raw.match(/^(\d{2})(\d{2})(\d{4})$/);
  if (compact) {
    return new Date(`${compact[3]}-${compact[2]}-${compact[1]}T12:00:00`);
  }
  const french = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (french) {
    return new Date(`${french[3]}-${french[2]}-${french[1]}T12:00:00`);
  }
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    return new Date(`${iso[1]}-${iso[2]}-${iso[3]}T12:00:00`);
  }
  return new Date("invalid");
}

function normalizeDateDisplay(value) {
  const raw = String(value || "").trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) return raw;
  const compact = raw.match(/^(\d{2})(\d{2})(\d{4})$/);
  if (compact) return `${compact[1]}/${compact[2]}/${compact[3]}`;
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return iso ? `${iso[3]}/${iso[2]}/${iso[1]}` : raw;
}

function nightsBetween(checkIn, checkOut) {
  const start = parseDateInput(checkIn);
  const end = parseDateInput(checkOut);
  const nights = Math.round((end - start) / 86400000);
  return Number.isFinite(nights) && nights > 0 ? nights : 0;
}

async function createBooking(req, res) {
  const body = await readBody(req);
  const listings = await readListings();
  const listing = listings.find((item) => item.id === body.listingId);
  if (!listing) return sendJson(res, { error: "Logement invalide" }, 400);

  const user = await getSupabaseUser(req);
  if (isSupabaseConfigured() && !user) {
    return sendJson(res, { error: "Vous devez etre connecte pour reserver ce logement" }, 401);
  }

  const nights = nightsBetween(body.checkIn, body.checkOut);
  if (!body.name || !body.email || !body.checkIn || !body.checkOut || nights < 1) {
    return sendJson(res, { error: "Champs de reservation invalides" }, 400);
  }

  const guests = Math.max(1, Math.min(Number(body.guests || 1), 20));
  const discountCode = String(body.discountCode || "").trim().toUpperCase();
  const subtotal = listing.price * nights;
  const discount = discountCode === "EARLYBIRD" ? Math.round(subtotal * 0.1) : 0;
  const total = subtotal - discount;
  const bookingPayload = {
    createdAt: new Date().toISOString(),
    name: String(body.name).trim(),
    email: String(body.email).trim(),
    listingId: listing.id,
    listingTitle: listing.title,
    city: listing.city,
    checkIn: normalizeDateDisplay(body.checkIn),
    checkOut: normalizeDateDisplay(body.checkOut),
    guests,
    nights,
    pricePerNight: listing.price,
    subtotal,
    discountCode: discount ? discountCode : "",
    discount,
    total,
    paymentStatus: "pending"
  };

  if (isSupabaseConfigured()) {
    const token = getBearerToken(req);
    const rows = await supabaseRequest("/rest/v1/bookings", {
      method: "POST",
      token,
      prefer: "return=representation",
      body: {
        user_id: user.id,
        listing_id: listing.id,
        name: bookingPayload.name,
        email: bookingPayload.email,
        listing_title: listing.title,
        city: listing.city,
        check_in: bookingPayload.checkIn,
        check_out: bookingPayload.checkOut,
        guests,
        nights,
        price_per_night: listing.price,
        subtotal,
        discount_code: bookingPayload.discountCode,
        discount,
        total,
        payment_status: "pending"
      }
    });
    const booking = mapBookingFromDb(rows[0]);
    notifyAutomation(booking).catch((error) => console.warn("Webhook ignore:", error.message));
    return sendJson(res, { booking }, 201);
  }

  const booking = {
    id: crypto.randomUUID(),
    ...bookingPayload
  };

  const bookings = await readBookings();
  bookings.unshift(booking);
  await saveBookings(bookings);
  notifyAutomation(booking).catch((error) => console.warn("Webhook ignore:", error.message));
  sendJson(res, { booking }, 201);
}

async function createListing(req, res) {
  const body = await readBody(req);
  const user = await getSupabaseUser(req);
  if (isSupabaseConfigured() && !user) {
    return sendJson(res, { error: "Vous devez etre connecte pour ajouter un logement" }, 401);
  }
  const title = String(body.title || "").trim();
  const city = String(body.city || "").trim();
  const price = Number(body.price);
  const guests = Number(body.guests);
  const noise = Number(body.noise || 32);
  if (!title || !city || !Number.isFinite(price) || price < 1 || !Number.isFinite(guests) || guests < 1) {
    return sendJson(res, { error: "Champs logement invalides" }, 400);
  }

  const listing = {
    id: `${slugify(title)}-${crypto.randomUUID().slice(0, 8)}`,
    title,
    city,
    price: Math.round(price),
    guests: Math.min(Math.round(guests), 20),
    noise: Math.max(20, Math.min(Math.round(noise), 70)),
    rating: Number(body.rating || 4.8),
    image: String(body.image || "").trim() || "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=1400&q=80",
    description: String(body.description || "Logement calme ajoute par un hote ZenStay.").trim(),
    amenities: String(body.amenities || "Wifi, Cuisine equipee, Literie confortable")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    reviews: ["Nouveau logement hote, en attente des premiers avis."],
    hostEmail: String(body.hostEmail || "").trim(),
    createdAt: new Date().toISOString()
  };

  if (isSupabaseConfigured()) {
    const rows = await supabaseRequest("/rest/v1/listings", {
      method: "POST",
      token: getBearerToken(req),
      prefer: "return=representation",
      body: {
        id: listing.id,
        title: listing.title,
        city: listing.city,
        price: listing.price,
        guests: listing.guests,
        noise: listing.noise,
        rating: listing.rating,
        image: listing.image,
        description: listing.description,
        amenities: listing.amenities,
        reviews: listing.reviews,
        host_id: user.id,
        host_email: user.email
      }
    });
    return sendJson(res, { listing: mapListingFromDb(rows[0]) }, 201);
  }

  const listings = await readListings();
  listings.unshift(listing);
  await saveListings(listings);
  sendJson(res, { listing }, 201);
}

function slugify(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "logement";
}

async function createCheckoutSession(req, res) {
  const { bookingId } = await readBody(req);
  if (isSupabaseConfigured() && !getBearerToken(req)) {
    return sendJson(res, { error: "Vous devez etre connecte pour payer cette reservation" }, 401);
  }
  const booking = await findBookingById(bookingId, req);
  if (!booking) return sendJson(res, { error: "Reservation introuvable" }, 404);

  const origin = getOrigin(req);
  const stripeSecretKey = String(process.env.STRIPE_SECRET_KEY || "").trim();
  if (!stripeSecretKey || stripeSecretKey === "sk_test_xxx") {
    return sendJson(res, {
      error: "Stripe n'est pas configure. Ajoutez STRIPE_SECRET_KEY dans .env pour ouvrir Stripe Checkout."
    }, 500);
  }

  const params = new URLSearchParams();
  params.set("mode", "payment");
  params.set("client_reference_id", booking.id);
  params.set("success_url", `${origin}/success?bookingId=${encodeURIComponent(booking.id)}`);
  params.set("cancel_url", `${origin}/#/booking/${encodeURIComponent(booking.listingId)}?bookingId=${encodeURIComponent(booking.id)}`);
  params.set("line_items[0][quantity]", "1");
  params.set("line_items[0][price_data][currency]", "eur");
  params.set("line_items[0][price_data][unit_amount]", String(booking.total * 100));
  params.set("line_items[0][price_data][product_data][name]", `ZenStay - ${booking.listingTitle}`);
  params.set("line_items[0][price_data][product_data][description]", `${booking.nights} nuit(s), ${booking.guests} voyageur(s)`);

  const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: params
  });
  const session = await stripeResponse.json();
  if (!stripeResponse.ok) return sendJson(res, { error: session.error?.message || "Stripe indisponible" }, 502);
  sendJson(res, { url: session.url, mode: "stripe" });
}

async function markBookingPaid(bookingId, req) {
  if (isSupabaseConfigured()) {
    const token = getBearerToken(req);
    if (!token) throw new Error("Connexion requise");
    await supabaseRequest(`/rest/v1/bookings?id=eq.${encodeURIComponent(bookingId)}`, {
      method: "PATCH",
      token,
      body: {
        payment_status: "paid",
        paid_at: new Date().toISOString()
      }
    });
    return;
  }
  const bookings = await readBookings();
  const index = bookings.findIndex((item) => item.id === bookingId);
  if (index === -1) return;
  bookings[index] = {
    ...bookings[index],
    paymentStatus: "paid",
    paidAt: new Date().toISOString()
  };
  await saveBookings(bookings);
}

async function notifyAutomation(booking) {
  if (!process.env.WEBHOOK_URL) return;
  const payload = {
    nom: booking.name,
    email: booking.email,
    logement: booking.listingTitle,
    ville: booking.city,
    dates: `${booking.checkIn} -> ${booking.checkOut}`,
    voyageurs: booking.guests,
    prix_total: booking.total,
    statut_paiement: booking.paymentStatus
  };
  await fetch(process.env.WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

async function sendInvoiceToN8n(req, res) {
  const { bookingId } = await readBody(req);
  if (!bookingId) return sendJson(res, { error: "bookingId requis" }, 400);

  const booking = await findBookingById(bookingId, req);
  if (!booking) return sendJson(res, { error: "Reservation introuvable" }, 404);

  const invoiceHtml = generateInvoiceHtml(booking);

  const webhookUrl = process.env.WEBHOOK_INVOICE_URL || process.env.WEBHOOK_URL;
  if (!webhookUrl) {
    return sendJson(res, { error: "WEBHOOK_INVOICE_URL non configure" }, 500);
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookingId: booking.id,
        email: booking.email,
        name: booking.name,
        invoiceHtml: invoiceHtml,
        booking: {
          id: booking.id,
          listingTitle: booking.listingTitle,
          city: booking.city,
          checkIn: booking.checkIn,
          checkOut: booking.checkOut,
          guests: booking.guests,
          nights: booking.nights,
          pricePerNight: booking.pricePerNight,
          subtotal: booking.subtotal,
          discount: booking.discount,
          total: booking.total,
          paymentStatus: booking.paymentStatus
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status}`);
    }

    sendJson(res, { success: true, message: "Facture envoyee" });
  } catch (error) {
    console.error("Erreur envoi facture:", error);
    sendJson(res, { error: "Erreur lors de l'envoi de la facture" }, 500);
  }
}

function generateInvoiceHtml(booking) {
  const euro = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Facture ZenStay - ${booking.id}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; color: #333; }
    .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #FF385C; padding-bottom: 20px; }
    .header h1 { margin: 0; color: #FF385C; }
    .section { margin-bottom: 30px; }
    .section h2 { color: #222; font-size: 18px; margin-bottom: 15px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
    .info-item { padding: 10px; background: #f7f7f7; border-radius: 5px; }
    .info-label { font-weight: bold; color: #666; font-size: 12px; text-transform: uppercase; }
    .info-value { font-size: 16px; margin-top: 5px; }
    .total-section { background: #FF385C; color: white; padding: 20px; border-radius: 8px; margin-top: 30px; }
    .total-line { display: flex; justify-content: space-between; margin-bottom: 10px; }
    .total-final { font-size: 24px; font-weight: bold; border-top: 2px solid white; padding-top: 15px; margin-top: 15px; }
    .status-badge { display: inline-block; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; }
    .status-paid { background: #4CAF50; color: white; }
    .status-pending { background: #FF9800; color: white; }
    .footer { text-align: center; margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🏡 ZenStay</h1>
    <p>Facture de réservation</p>
  </div>

  <div class="section">
    <h2>Informations client</h2>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Nom</div>
        <div class="info-value">${booking.name}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Email</div>
        <div class="info-value">${booking.email}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <h2>Détails de la réservation</h2>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Numéro de réservation</div>
        <div class="info-value">${booking.id}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Statut</div>
        <div class="info-value">
          <span class="status-badge ${booking.paymentStatus === 'paid' ? 'status-paid' : 'status-pending'}">
            ${booking.paymentStatus === 'paid' ? 'PAYÉ' : 'EN ATTENTE'}
          </span>
        </div>
      </div>
      <div class="info-item">
        <div class="info-label">Logement</div>
        <div class="info-value">${booking.listingTitle}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Ville</div>
        <div class="info-value">${booking.city}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Arrivée</div>
        <div class="info-value">${booking.checkIn}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Départ</div>
        <div class="info-value">${booking.checkOut}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Voyageurs</div>
        <div class="info-value">${booking.guests} personne(s)</div>
      </div>
      <div class="info-item">
        <div class="info-label">Nuits</div>
        <div class="info-value">${booking.nights} nuit(s)</div>
      </div>
    </div>
  </div>

  <div class="total-section">
    <div class="total-line">
      <span>${euro.format(booking.pricePerNight)} × ${booking.nights} nuits</span>
      <span>${euro.format(booking.subtotal)}</span>
    </div>
    ${booking.discount > 0 ? `
    <div class="total-line">
      <span>Réduction (${booking.discountCode})</span>
      <span>-${euro.format(booking.discount)}</span>
    </div>
    ` : ''}
    <div class="total-line total-final">
      <span>TOTAL</span>
      <span>${euro.format(booking.total)}</span>
    </div>
  </div>

  <div class="footer">
    <p>Merci d'avoir choisi ZenStay pour votre séjour !</p>
    <p>© ${new Date().getFullYear()} ZenStay - Logements calmes</p>
  </div>
</body>
</html>
  `.trim();
}

function getOrigin(req) {
  const proto = req.headers["x-forwarded-proto"] || "http";
  return `${proto}://${req.headers.host}`;
}

function sendJson(res, payload, status = 200) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

async function serveStatic(pathname, res) {
  const cleanPath = pathname === "/" ? "/index.html" : decodeURIComponent(pathname);
  const normalized = normalize(cleanPath).replace(/^(\.\.[/\\])+/, "");
  const filePath = join(publicDir, normalized);
  if (!filePath.startsWith(publicDir)) return sendJson(res, { error: "Chemin invalide" }, 400);

  return serveFile(res, filePath);
}

async function serveFile(res, filePath) {
  try {
    const content = await readFile(filePath);
    const type = mimeTypes[extname(filePath)] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": type });
    res.end(content);
  } catch {
    const index = await readFile(join(publicDir, "index.html"));
    res.writeHead(200, { "Content-Type": mimeTypes[".html"] });
    res.end(index);
  }
}
