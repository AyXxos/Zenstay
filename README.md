# ZenStay - Plateforme de logements calmes 🏡

Application web autonome de réservation de logements calmes avec niveau sonore mesuré.

## 🚀 Démarrage rapide

```bash
node server.mjs
```

Par défaut, le serveur écoute `http://localhost:3000`. Si le port est pris, il utilisera automatiquement le port suivant disponible (4173, etc.).

## 🧪 Mode Test / Démo

### Voir les réservations dans votre profil :
1. Cliquer sur l'icône utilisateur (menu hamburger + avatar)
2. Se connecter avec : **`test@example.com`** (n'importe quel mot de passe)
3. Aller dans "Profil" → Vous verrez **2 réservations de test** avec badges de statut

### Tester les paiements Stripe :
- Carte de test : **`4242 4242 4242 4242`**
- Date : n'importe quelle date future
- CVC : n'importe quel code à 3 chiffres

## ✨ Fonctionnalités

- 🏠 Landing page responsive ZenStay
- 📋 Catalogue de 6 logements calmes avec filtres (ville, prix, voyageurs)
- 🔍 Page détail logement avec note, capacité, niveau sonore, équipements et avis
- 📅 Formulaire de réservation avec calcul automatique du total
- 💳 Dates au format français `jj/mm/aaaa`
- 👥 Sélection jusqu'à 20 voyageurs
- 🎟️ Code promo `EARLYBIRD` avec remise de 10%
- 💾 Sauvegarde des réservations dans `data/bookings.json`
- 🏡 Ajout de logements hôte (compte requis)
- 🖼️ Upload d'images vers Supabase Storage (`listing-images`)
- 🔐 Gestion de compte avec Supabase ou mode local
- 💳 Paiement Stripe Checkout (mode test)
- ✅ Page succès avec impression PDF de confirmation
- 🌓 Dark mode
- 📧 **Newsletter avec webhook n8n**
- 👤 **Profil utilisateur avec badges de statut et liens cliquables**
- 🔗 Webhook Make / n8n / Zapier pour automatisation

## ⚙️ Configuration

Copier `.env.example` vers `.env` et configurer :

```env
PORT=3000
STRIPE_SECRET_KEY=sk_test_xxx
WEBHOOK_URL=https://n8n.fatonfaton.fr/webhook/6cccda76-7cba-42dc-8bbc-ebbd4ddd313b
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_ANON_KEY=votre_anon_key
```

## 📧 Newsletter (n8n)

Le formulaire newsletter dans le footer envoie les emails au webhook n8n configuré dans `WEBHOOK_URL`.

Format envoyé :
```json
{
  "email": "utilisateur@example.com"
}
```

## 🔒 Mode Stripe Test

Sans clé Stripe, le paiement utilise un mode démo local.

Avec `STRIPE_SECRET_KEY=sk_test_xxx`, utilisez la carte test : **4242 4242 4242 4242**

## 🤖 Webhook automatisation (réservations)

Pour recevoir les réservations dans Make/n8n/Zapier :

```bash
WEBHOOK_URL=https://votre-webhook.example node server.mjs
```

Payload envoyé :
```json
{
  "nom": "Jean Dupont",
  "email": "jean@example.com",
  "logement": "Villa calme a Biarritz",
  "ville": "Biarritz",
  "dates": "15/06/2026 -> 22/06/2026",
  "voyageurs": 4,
  "prix_total": 756,
  "statut_paiement": "paid"
}
```

## 🗄️ Comptes Supabase

Pour activer Supabase (base de données + auth) :

```bash
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_ANON_KEY=votre_anon_key
```

Sans ces variables, l'app fonctionne en **mode local** avec fichiers JSON.

## 📁 Structure

```
├── server.mjs              # Serveur Node.js
├── public/
│   ├── index.html         # Page principale
│   ├── app.js             # JavaScript frontend
│   └── styles.css         # Styles CSS
├── data/
│   ├── bookings.json      # Réservations (mode local)
│   └── listings.json      # Logements
├── .env                   # Configuration (non commité)
└── .env.example           # Template de configuration
```

## 🔗 Liens

- **Repository** : https://github.com/AyXxos/Zenstay.git
- **Changelog** : Voir [CHANGELOG.md](CHANGELOG.md)
