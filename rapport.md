# Plan de mise en place - Tebex, Backend, Sealed Secrets, Admin

Date: 2026-04-15

## Objectif produit

- Integrer Tebex au backend pour gerer le paiement et le post-paiement.
- Cote site frontend: ne recuperer qu'un statut simple (`ok` / `paid`) via API.
- Ajouter plus tard un dashboard ` /admin ` pour pilotage (joueurs, paiements, stats).

---

## 1) Tebex + backend (MVP)

### 1.1 Flux cible
1. Le joueur choisit un produit sur le site.
2. Le backend cree/associe la transaction Tebex.
3. Tebex confirme le paiement (webhook/callback cote backend).
4. Le backend:
   - verifie l'authenticite de l'evenement,
   - marque la commande comme payee en base,
   - execute la commande Minecraft (RCON/API/plugin),
   - retourne un `200 OK`.
5. Le frontend appelle un endpoint de statut et affiche "paiement valide".

### 1.2 Endpoints backend a prevoir
- `POST /api/checkout/create`
- `POST /api/tebex/webhook`
- `GET /api/checkout/:id/status`
- `GET /api/store/products` (optionnel si produits dynamiques)

### 1.3 Base de donnees (minimum)
- `players`: id, pseudo, uuid_mc, created_at
- `orders`: id, player_id, tebex_txn_id, product_id, amount, currency, status, paid_at
- `order_events`: id, order_id, source, payload_hash, created_at (audit)
- `mc_command_jobs`: id, order_id, command, status, executed_at, error

---

## 2) Sealed Secrets - emplacement des cles (deja prepare)

Les emplacements sont deja crees dans:

- `charts/valoria/values.yaml`

Section:

```yaml
sealedSecret:
  enabled: false
  encryptedData:
    tebex-secret-key: Ag...
    tebex-public-token: Ag...
    tebex-project-id: Ag...
    jwt-private-key: Ag...
    jwt-public-key: Ag...
```

Important:
- Ces valeurs doivent etre des valeurs **chiffrees kubeseal** (`Ag...`), pas du clair.
- Tu actives ensuite:

```yaml
sealedSecret:
  enabled: true
```

### 2.1 "Meme .pem que Clos de la Reine"
- Si tu parles des cles JWT app (`jwt-private-key` / `jwt-public-key`), tu peux reutiliser les memes valeurs fonctionnellement.
- Si tu parles du chiffrement Sealed Secrets: ce n'est pas le meme mecanisme; il depend du controller du cluster.

---

## 3) SEO - actions restantes

Deja en place:
- `robots.txt` + `sitemap.xml`
- JSON-LD de base (Organization/WebSite)
- metas OG/Twitter/canonical consolidees

A continuer:
1. Ajouter JSON-LD specifique par page (FAQ, BreadcrumbList, Product quand boutique backend prete).
2. Mettre a jour auto `sitemap.xml` si routes dynamiques.
3. Verifier les previews OG (taille image 1200x630) apres mise en prod.

---

## 4) Securite - actions restantes

Deja en place:
- headers nginx (CSP, X-Frame-Options, etc.)
- scans CI (Trivy image + Trivy config + CodeQL)
- template SealedSecret parametrable

A continuer:
1. Branch protection stricte (`main`) avec checks obligatoires.
2. Secret scanning/push protection GitHub (si dispo sur le plan).
3. Rotation des secrets tous les 90 jours (procedure dans `SECURITY.md`).

---

## 5) Plan dashboard `/admin`

### 5.1 Scope v1
- KPIs: CA 24h/7j/30j, commandes, top produits
- Tableau commandes: statut, joueur, montant, date, execution commande MC
- Joueurs: historique achats et credits
- Logs techniques: webhooks Tebex recus, erreurs, retries

### 5.2 Securite admin
- Auth obligatoire (session/JWT + role `admin`)
- RBAC (admin/read-only)
- Journal d'audit des actions admin
- Rate limit et protection CSRF

### 5.3 Roadmap
1. V1 lecture seule (stats + commandes).
2. V2 actions manuelles (retry commande MC, remboursement marque interne).
3. V3 exports CSV + alertes (Discord/Gotify).

---

## 6) Ordre d'execution recommande

1. Backend Tebex minimal (webhook + statut commande).
2. Execution commande Minecraft fiable (queue + retry + logs).
3. Brancher frontend boutique sur statut backend.
4. Activer Sealed Secrets reelles (`enabled: true` + `Ag...`).
5. Construire `/admin` v1.

---

## 7) Checklist immediate

- [ ] Chiffrer et coller les 5 cles dans `values.yaml`
- [ ] Passer `sealedSecret.enabled` a `true` en prod
- [ ] Deployer et tester un paiement Tebex sandbox de bout en bout
- [ ] Verifier que le backend retourne bien `ok` au frontend apres paiement
- [ ] Lancer le chantier `/admin` v1
