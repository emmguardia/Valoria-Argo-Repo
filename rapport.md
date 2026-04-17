# Plan de mise en place - Auth + Paiements Stripe/RCON

Date: 2026-04-16

## Objectif produit

- Garder l'authentification utilisateur (inscription, connexion, profil, solde Écus).
- Conserver tout le visuel boutique.
- Remplacer l'ancien flux paiement par un futur flux Stripe + RCON.

---

## 1) Backend auth (actuel)

Déjà en place:
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `PUT /api/auth/me`
- `DELETE /api/auth/me`

Base:
- `users`: pseudo, email, password_hash, ecus, created_at, last_login

---

## 2) Paiements (désactivés temporairement)

État actuel:
- Le visuel boutique est conservé.
- Les paiements sont volontairement désactivés côté frontend/backend.

Objectif futur:
- Intégrer Stripe Checkout (création de session backend).
- Traiter les webhooks Stripe pour confirmer les paiements.
- Exécuter les commandes serveur via RCON après paiement validé.

---

## 3) Sealed Secrets

Conserver:
- `db-host`
- `db-port`
- `db-name`
- `db-user`
- `db-password`
- `jwt-private-key`
- `jwt-public-key`

Ne plus utiliser de clés liées à l'ancien provider de paiement.

---

## 4) Roadmap Stripe + RCON

1. `POST /api/payments/create-checkout-session`
2. `POST /api/payments/webhook`
3. `POST /api/rcon/execute` (interne, protégé)
4. Suivi des commandes en base (`orders`, `order_events`, `mc_command_jobs`)
5. Dashboard `/admin` pour suivi paiements et exécutions

