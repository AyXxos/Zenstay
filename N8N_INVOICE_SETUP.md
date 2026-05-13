# Configuration n8n pour l'envoi de facture PDF

## 📧 Flux de travail n8n

Le système envoie automatiquement une facture PDF par email après un paiement réussi.

## 📥 Données reçues par le webhook n8n

Le webhook reçoit un POST avec ce format JSON :

```json
{
  "bookingId": "uuid-de-la-reservation",
  "email": "client@example.com",
  "name": "Jean Dupont",
  "invoiceHtml": "<!DOCTYPE html>...",
  "booking": {
    "id": "uuid",
    "listingTitle": "Villa calme a Biarritz",
    "city": "Biarritz",
    "checkIn": "15/06/2026",
    "checkOut": "22/06/2026",
    "guests": 4,
    "nights": 7,
    "pricePerNight": 120,
    "subtotal": 840,
    "discount": 84,
    "total": 756,
    "paymentStatus": "paid"
  }
}
```

## 🔧 Configuration n8n recommandée

### 1. Webhook Trigger
- **Type**: POST
- **Path**: `/webhook/VOTRE_ID_UNIQUE`
- **Authentication**: None (ou Basic Auth selon vos besoins)

### 2. HTML to PDF
Utilisez un noeud pour convertir le HTML en PDF :

**Option A - Node "HTML to PDF"** (si disponible)
- Input: `{{ $json.invoiceHtml }}`
- Output format: PDF
- Page size: A4
- Margin: 10mm

**Option B - Node "HTTP Request" avec API tierce**
Services recommandés :
- PDFShift (https://pdfshift.io)
- CloudConvert (https://cloudconvert.com)
- WeasyPrint (self-hosted)

Exemple avec PDFShift :
```javascript
// HTTP Request Node
Method: POST
URL: https://api.pdfshift.io/v3/convert/pdf
Headers: {
  "Authorization": "Basic YOUR_API_KEY"
}
Body: {
  "source": "{{ $json.invoiceHtml }}",
  "landscape": false,
  "use_print": true
}
```

### 3. Send Email (Gmail / SMTP / SendGrid)
- **To**: `{{ $json.email }}`
- **Subject**: `Votre facture ZenStay - Réservation {{ $json.booking.listingTitle }}`
- **Body**: 
```
Bonjour {{ $json.name }},

Merci d'avoir réservé avec ZenStay !

Vous trouverez ci-joint votre facture pour votre séjour à {{ $json.booking.listingTitle }}.

Détails de votre réservation :
- Arrivée : {{ $json.booking.checkIn }}
- Départ : {{ $json.booking.checkOut }}
- Voyageurs : {{ $json.booking.guests }}
- Total : {{ $json.booking.total }}€

Au plaisir de vous accueillir !

L'équipe ZenStay
```
- **Attachments**: PDF généré à l'étape précédente
- **Filename**: `facture-zenstay-{{ $json.bookingId }}.pdf`

## 🔐 Variables d'environnement

Ajoutez dans votre `.env` :

```env
WEBHOOK_INVOICE_URL=https://n8n.fatonfaton.fr/webhook/VOTRE_ID_UNIQUE
```

## ✅ Test du webhook

### Depuis le terminal :

```bash
curl -X POST "https://n8n.fatonfaton.fr/webhook/VOTRE_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "test-123",
    "email": "test@example.com",
    "name": "Test User",
    "invoiceHtml": "<!DOCTYPE html><html><body><h1>Test</h1></body></html>",
    "booking": {
      "id": "test-123",
      "listingTitle": "Test Villa",
      "city": "Test City",
      "checkIn": "01/01/2026",
      "checkOut": "08/01/2026",
      "guests": 2,
      "nights": 7,
      "pricePerNight": 100,
      "subtotal": 700,
      "discount": 0,
      "total": 700,
      "paymentStatus": "paid"
    }
  }'
```

### Depuis l'interface ZenStay :

1. Aller sur http://localhost:4173
2. Se connecter avec `test@example.com`
3. Faire une réservation test
4. Sur la page de succès, cliquer sur "📧 Envoyer facture par email"

## 📋 Checklist avant déploiement

- [ ] Webhook n8n créé et testé
- [ ] Service de conversion HTML → PDF configuré
- [ ] Email SMTP/SendGrid configuré
- [ ] Variable `WEBHOOK_INVOICE_URL` définie dans `.env`
- [ ] Test d'envoi réussi
- [ ] Vérification que le PDF s'affiche correctement
- [ ] Email reçu avec la bonne mise en forme

## 🐛 Debugging

Si la facture n'est pas envoyée :

1. Vérifier les logs n8n
2. Vérifier que `WEBHOOK_INVOICE_URL` est défini dans `.env`
3. Tester le webhook avec curl
4. Vérifier la console du navigateur (F12) pour les erreurs
5. Vérifier les logs du serveur Node.js

## 📝 Notes

- Le HTML de la facture est généré côté serveur et est prêt à être converti en PDF
- Le style CSS est inline pour garantir le rendu correct en PDF
- La facture contient tous les détails : client, réservation, prix, statut
- Le format est optimisé pour A4 et l'impression
