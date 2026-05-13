# Changelog ZenStay

## Modifications du 13 mai 2026

### ✅ Intégration Newsletter
- Ajout d'un formulaire d'inscription à la newsletter dans le footer
- Intégration du webhook n8n : `https://n8n.fatonfaton.fr/webhook/6cccda76-7cba-42dc-8bbc-ebbd4ddd313b`
- Gestion des erreurs et messages de confirmation
- Design responsive et cohérent avec le reste du site

### ✅ Correction Navigation Page Success
- Ajout de liens de navigation supplémentaires sur la page de confirmation de paiement
- L'utilisateur peut maintenant :
  - Retourner à l'accueil
  - Voir tous les logements
  - Télécharger le PDF de confirmation
- Ajout d'une icône de validation visuelle
- Amélioration de la mise en page avec flex layout

### ✅ Amélioration du Profil Utilisateur
- Les réservations affichent maintenant :
  - Badge de statut (Payé / En attente) avec couleurs distinctes
  - Lien cliquable vers le logement réservé
  - Prix total formaté
- Les annonces affichent maintenant :
  - Lien cliquable vers la page du logement
  - Note avec étoile
  - Informations détaillées (ville, prix, voyageurs, dB)
  - Image du logement
- Liens d'action si aucune donnée (découvrir logements / devenir hôte)

### 📁 Fichiers modifiés
- `public/index.html` : Ajout de la section newsletter dans le footer
- `public/app.js` : 
  - Fonction `submitNewsletter()` pour gérer l'inscription
  - Amélioration de `renderSuccess()` avec plus de liens de navigation
  - Amélioration de `renderAccount()` avec badges et liens cliquables

### 🧪 Tests
- ✅ Webhook newsletter testé et fonctionnel (HTTP 200)
- ✅ Serveur ZenStay démarre correctement sur le port 8080
- ✅ Interface HTML charge correctement
