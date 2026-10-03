# POINTA Web

Application responsive/PWA Next.js pour les espaces Personnel, RH, Direction et Sécurité.

## Développement

Depuis `F:\GE` :

```powershell
npm --prefix .\frontend run dev
```

Vérifications :

```powershell
npm --prefix .\frontend run lint
npm --prefix .\frontend run build
```

Le scanner de badges utilise `html5-qrcode`. Sur téléphone, l'accès caméra nécessite une origine sécurisée HTTPS (ou localhost) et l'autorisation de l'utilisateur. Les codes présents sur l'écran de démonstration ne sont pas reliés à l'API.