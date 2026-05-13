CDC pour IA — Création de ZenStay
Objectif

Créer une application web complète appelée ZenStay, un clone simplifié d’Airbnb spécialisé dans les logements calmes.

L’utilisateur doit pouvoir :

arriver sur une landing page ;
voir des logements ;
consulter le détail d’un logement ;
faire une réservation ;
payer via Stripe test ;
recevoir une confirmation.
Stack attendue

Utiliser :

React / Next.js ou stack native de Lovable ;
design responsive ;
base de données simple pour les logements et réservations ;
intégration Stripe Checkout en mode test ;
automatisation possible via Make, n8n ou Zapier.
Pages à créer
1. Landing page

Créer une landing page moderne inspirée d’Airbnb, mais pour la marque ZenStay.

Elle doit contenir :

header avec logo ZenStay ;
navigation simple ;
bouton “Devenir hôte” ;
hero section avec slogan ;
barre de recherche avec lieu, dates, voyageurs ;
grille de 6 logements ;
carte logement avec image, ville, prix, note, niveau sonore ;
section expliquant le concept des logements calmes ;
footer crédible ;
responsive mobile.
2. Page liste des logements

Afficher tous les logements disponibles.

Chaque logement doit afficher :

image ;
titre ;
ville ;
prix par nuit ;
note ;
nombre de voyageurs ;
niveau sonore en dB ;
bouton “Voir le logement”.
3. Page détail logement

Afficher les informations complètes du logement :

grande image ;
nom du logement ;
ville ;
description ;
prix par nuit ;
note ;
niveau sonore ;
capacité ;
équipements ;
calendrier ou choix de dates ;
bouton “Réserver”.
4. Page réservation

Créer un formulaire avec :

nom ;
email ;
date d’arrivée ;
date de départ ;
nombre de voyageurs ;
logement sélectionné ;
prix total calculé ;
bouton “Confirmer la réservation”.

Après validation :

enregistrer la réservation ;
afficher un écran “Réservation envoyée” ;
proposer un bouton “Payer mon séjour”.
5. Paiement Stripe

Ajouter un bouton “Payer mon séjour”.

Le bouton doit :

envoyer vers Stripe Checkout en mode test ;
transmettre le bon montant ;
utiliser la carte test Stripe 4242 4242 4242 4242 ;
après paiement, afficher une page succès ;
mettre le statut de réservation en payé si possible.
6. Automatisation

Prévoir une structure compatible avec Make / n8n / Zapier.

À chaque nouvelle réservation :

envoyer un email de confirmation au voyageur ;
envoyer une notification à l’hôte ;
ajouter une ligne dans Google Sheet nommé bookings.

Champs à envoyer :

nom ;
email ;
logement ;
ville ;
dates ;
voyageurs ;
prix total ;
statut de paiement.
Données exemples

Créer 6 logements fictifs :

Villa calme à Biarritz — 120€/nuit — 4 voyageurs — 32 dB — note 4.9
Studio zen à Annecy — 85€/nuit — 2 voyageurs — 30 dB — note 4.8
Maison nature à Aix-en-Provence — 150€/nuit — 6 voyageurs — 34 dB — note 4.7
Cabane boisée en Dordogne — 95€/nuit — 3 voyageurs — 28 dB — note 4.9
Appartement vue mer à Nice — 130€/nuit — 4 voyageurs — 35 dB — note 4.6
Chalet paisible à Chamonix — 170€/nuit — 5 voyageurs — 31 dB — note 4.8
Design attendu

Style :

moderne ;
clair ;
propre ;
proche d’Airbnb mais pas copié ;
beaucoup d’espace ;
cartes arrondies ;
images grandes ;
boutons visibles ;
responsive mobile.

Couleurs :

blanc ;
beige clair ;
vert doux ;
rose/corail léger pour les CTA.
Fonctionnalités obligatoires
Landing page live.
Liste de logements.
Page détail logement.
Formulaire de réservation.
Calcul du prix total.
Confirmation de réservation.
Bouton de paiement Stripe test.
Page succès après paiement.
Design responsive.
Données de réservation sauvegardées.
Fonctionnalités bonus
Dark mode.
Code promo EARLYBIRD.
PDF de confirmation.
Avis clients.
Filtre par ville, prix ou voyageurs.
Badge “moins de 35 dB”.