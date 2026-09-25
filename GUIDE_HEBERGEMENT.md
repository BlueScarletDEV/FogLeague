# 🚀 FogLeague — Guide Complet d'Hébergement (100% Gratuit — 0€ Budget)

Ce guide détaille toutes les options prêtes à l'emploi pour déployer FogLeague en production **sans dépenser un seul centime**, avec HTTPS/SSL automatique, support des WebSockets et protection anti-DDoS.

---

## 🎯 Résumé des Fichiers de Déploiement Créés

| Plateforme | Type d'Hébergement | Fichier de Configuration Clé | Coût |
|---|---|---|---|
| **Vercel** | Frontend (Vite / React) | [`vercel.json`](file:///C:/Users/Blue/.gemini/antigravity/scratch/fogleague/vercel.json) | **0€** (Gratuit à vie) |
| **Netlify** | Frontend (Vite / React) | [`netlify.toml`](file:///C:/Users/Blue/.gemini/antigravity/scratch/fogleague/netlify.toml) & [`public/_redirects`](file:///C:/Users/Blue/.gemini/antigravity/scratch/fogleague/public/_redirects) | **0€** (Gratuit à vie) |
| **Cloudflare Pages** | Frontend (Vite / React) | [`public/_redirects`](file:///C:/Users/Blue/.gemini/antigravity/scratch/fogleague/public/_redirects) | **0€** (Bande passante illimitée) |
| **Render.com** | Backend (Node.js + WebSockets) | [`render.yaml`](file:///C:/Users/Blue/.gemini/antigravity/scratch/fogleague/render.yaml) | **0€** (Plan Free Web Service) |
| **Railway** | Backend ou Full-Stack | [`railway.toml`](file:///C:/Users/Blue/.gemini/antigravity/scratch/fogleague/railway.toml) | **0€** (Crédits gratuits offerts) |
| **Fly.io** | Backend (Serveur Paris CDG) | [`fly.toml`](file:///C:/Users/Blue/.gemini/antigravity/scratch/fogleague/fly.toml) | **0€** (Free Tier micro-VM) |
| **Docker / VPS** | Full-Stack Universel | [`Dockerfile`](file:///C:/Users/Blue/.gemini/antigravity/scratch/fogleague/Dockerfile) & [`docker-compose.yml`](file:///C:/Users/Blue/.gemini/antigravity/scratch/fogleague/docker-compose.yml) | Selon votre serveur |
| **Supabase** | Base de données PostgreSQL | [`supabase/schema.sql`](file:///C:/Users/Blue/.gemini/antigravity/scratch/fogleague/supabase/schema.sql) | **0€** (Plan Free 500 Mo) |

---

## 🌟 OPTION 1 : La Meilleure Architecture Gratuite (Recommandée)

> **Frontend sur Vercel + Backend sur Render + Base sur Supabase**  
> Avantages : CDN mondial ultra-rapide pour le frontend, WebSockets stables sur Render, PostgreSQL géré sur Supabase.

### Étape 1 : Base de données (Supabase — 2 minutes)
1. Créez un compte gratuit sur [supabase.com](https://supabase.com).
2. Créez un nouveau projet (ex: `fogleague-prod`, région Europe / Frankfurt).
3. Ouvrez l'onglet **SQL Editor**, collez l'intégralité du fichier [`supabase/schema.sql`](file:///C:/Users/Blue/.gemini/antigravity/scratch/fogleague/supabase/schema.sql) et cliquez sur **Run**.
4. Dans **Project Settings > API**, notez :
   - `Project URL`
   - `anon public key`
   - `service_role secret key` (ne jamais donner au client)

---

### Étape 2 : Backend (Render.com — 3 minutes)
1. Créez un compte gratuit sur [render.com](https://render.com).
2. Cliquez sur **New > Web Service** et connectez votre dépôt GitHub.
3. Renseignez :
   - **Name** : `fogleague-backend`
   - **Region** : `Frankfurt (EU Central)`
   - **Build Command** : `npm install && npm run build`
   - **Start Command** : `node server/index.js`
   - **Plan** : `Free`
4. Dans la section **Environment Variables**, ajoutez :
   - `NODE_ENV` = `production`
   - `PORT` = `10000`
   - `SUPABASE_URL` = `https://votre-projet.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` = `votre_cle_secrete_service_role`
   - `FRONTEND_URL` = `https://votre-site.vercel.app` (votre URL Vercel de l'étape 3)
   - `STEAM_API_KEY` = `votre_cle_steam_optionnelle`
5. Cliquez sur **Create Web Service**. Render vous attribue une URL HTTPS (ex: `https://fogleague-backend.onrender.com`).

---

### Étape 3 : Frontend (Vercel — 2 minutes)
1. Créez un compte gratuit sur [vercel.com](https://vercel.com).
2. Cliquez sur **Add New > Project** et importez votre dépôt GitHub.
3. Vercel détecte automatiquement le framework **Vite** grâce à [`vercel.json`](file:///C:/Users/Blue/.gemini/antigravity/scratch/fogleague/vercel.json).
4. Dans **Environment Variables**, ajoutez :
   - `VITE_API_URL` = `https://fogleague-backend.onrender.com` (l'URL Render créée à l'étape 2)
   - `VITE_SUPABASE_URL` = `https://votre-projet.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `votre_cle_anon_publique`
5. Cliquez sur **Deploy**. Votre site est en ligne en quelques secondes avec HTTPS !

---

## ⚡ OPTION 2 : Le Déploiement "Tout-en-un" (1 Seul Service — Le Plus Simple)

> **FogLeague en conteneur unique sur Render ou Railway**  
> Le serveur Node.js compile le frontend et sert à la fois :
> 1. Les pages web React (`dist/`)
> 2. Les routes API REST (`/api/*`)
> 3. Les connexions WebSockets en temps réel (`ws://`)  
> **Zéro problème de CORS, zéro configuration multiple !**

1. Créez un Web Service sur **Render** ou **Railway**.
2. Renseignez :
   - **Build Command** : `npm install && npm run build`
   - **Start Command** : `npm start`
3. Variables d'environnement :
   - `NODE_ENV` = `production`
   - `SUPABASE_URL` = `https://votre-projet.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` = `votre_cle_secrete_service_role`
   - `FRONTEND_URL` = `https://votre-app.onrender.com` (l'URL de votre propre service)
4. Dès le démarrage, votre site complet fonctionne sur une URL unique !

---

## 🐳 OPTION 3 : Auto-hébergement Docker / VPS (Pour OVH, Hetzner ou Oracle Cloud Free)

Si vous disposez d'un VPS Linux (ou du serveur gratuit à vie d'Oracle Cloud) :

1. Installez Docker et Git :
   ```bash
   sudo apt update && sudo apt install -y git docker.io docker-compose-v2
   ```
2. Clonez votre projet :
   ```bash
   git clone <url_de_votre_depot> fogleague
   cd fogleague
   ```
3. Créez votre fichier `.env` :
   ```bash
   cp .env.example .env
   nano .env
   ```
4. Lancez l'application en arrière-plan :
   ```bash
   docker compose up -d --build
   ```
5. Vérifiez la santé du serveur :
   ```bash
   curl http://localhost:3001/api/health
   ```

---

## 📋 Checklist Avant Ouverture Publique aux Joueurs

- [ ] Avoir exécuté [`supabase/schema.sql`](file:///C:/Users/Blue/.gemini/antigravity/scratch/fogleague/supabase/schema.sql) dans l'éditeur SQL de Supabase.
- [ ] Vérifier que `FRONTEND_URL` sur le backend correspond exactement à l'adresse de votre site en ligne (pour que le retour Steam redirige vers le bon domaine).
- [ ] Vérifier que `VITE_API_URL` sur le frontend pointe vers votre backend HTTPS.
- [ ] Tester une connexion Steam en direct sur votre site en ligne.
