# Security Hardening Checklist

Ce document couvre les points de securite hors code (GitHub) et la procedure de rotation des Sealed Secrets.

## 1) GitHub protections (a configurer dans l'UI)

Configurer pour `main` et `dev`:

- Branch protection:
  - Require a pull request before merging
  - Require status checks to pass (build-and-push, security)
  - Require branches to be up to date before merging
  - Restrict who can push to matching branches
  - Do not allow force pushes
  - Do not allow deletions
- Secret scanning + push protection (si disponible sur le plan)
- Dependabot security updates active

## 2) Sealed Secrets (frontend-only pour l'instant)

Le chart lit maintenant `sealedSecret.encryptedData` depuis `values*.yaml`.

### Exemple de generation (namespace prod)

```bash
kubectl create secret generic valoria-secrets \
  -n valoria \
  --from-literal=vite-api-url="https://api.example.tld" \
  --dry-run=client -o yaml \
| kubeseal --format yaml --namespace valoria --name valoria-secrets \
> /tmp/valoria-sealed.yaml
```

Recopier ensuite les champs `spec.encryptedData` dans:

- `charts/valoria/values.yaml` -> `sealedSecret.encryptedData`
- `charts/valoria/values-dev.yaml` pour la dev

Puis activer:

```yaml
sealedSecret:
  enabled: true
```

## 3) Rotation recommandee

Frequence conseillee: tous les 90 jours (ou apres incident).

Etapes:

1. Regenerer les secrets bruts (nouvelles valeurs)
2. Rechiffrer avec `kubeseal`
3. Mettre a jour `sealedSecret.encryptedData`
4. Merge + sync ArgoCD
5. Verifier l'application et invalider les anciennes valeurs cote fournisseur
