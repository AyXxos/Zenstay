# ZenStay

Application web autonome creee depuis `CDC.md`.

## Lancer le site

```bash
npm start
```

Par defaut, le serveur ecoute `http://localhost:3000`. Si le port est pris :

```bash
PORT=4173 npm start
```

## Fonctionnalites

- Landing page responsive ZenStay.
- Catalogue de 6 logements calmes.
- Page detail logement avec note, capacite, niveau sonore, equipements et avis.
- Filtres par ville, prix et voyageurs.
- Formulaire de reservation avec calcul du total.
- Dates de reservation au format francais `jj/mm/aaaa`.
- Selection jusqu'a 20 voyageurs.
- Code promo `EARLYBIRD` avec remise de 10%.
- Sauvegarde des reservations dans `data/bookings.json`.
- Ajout de logements hote uniquement avec compte connecte.
- Image de logement en piece jointe, envoyee dans Supabase Storage (`listing-images`).
- Donnees logements et reservations dans Supabase quand `.env` est configure.
- Gestion de compte avec Supabase.
- Bouton paiement Stripe Checkout en mode test.
- Page succes et impression PDF de confirmation.
- Dark mode.
- Webhook Make / n8n / Zapier compatible Google Sheet `bookings`.

## Stripe test

Sans cle Stripe, le paiement utilise un mode demo local et redirige vers la page succes.

Pour utiliser Stripe Checkout test :

```bash
STRIPE_SECRET_KEY=sk_test_xxx npm start
```

Carte test Stripe : `4242 4242 4242 4242`.

## Automatisation

Pour notifier Make, n8n ou Zapier a chaque reservation :

```bash
WEBHOOK_URL=https://votre-webhook.example npm start
```

Le payload contient : nom, email, logement, ville, dates, voyageurs, prix total et statut de paiement.

## Comptes Supabase

Pour activer la gestion de compte avec Supabase :

```bash
SUPABASE_URL=https://votre-projet.supabase.co SUPABASE_ANON_KEY=votre_anon_key npm start
```

Sans ces variables, la page compte fonctionne en mode local de demonstration dans le navigateur.
