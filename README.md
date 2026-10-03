# POINTA

Plateforme responsive/PWA de gestion du personnel, des horaires, des présences et des processus RH.

## Structure

- `frontend/` : Next.js, TypeScript, Tailwind CSS et scanner QR.
- `backend/` : API Laravel 13, Sanctum, modèles et migrations PostgreSQL.

## Démarrage

Ouvrir deux terminaux PowerShell depuis `F:\GE` :

```powershell
npm --prefix .\frontend run dev
```

```powershell
php .\backend\artisan serve
```

Le seeder crée six comptes de démonstration uniquement en environnement local ou de test :
`admin@gmail.com`, `rh@gmail.com`, `direction@gmail.com`, `securite@gmail.com`,
`responsable@gmail.com` et `personnel@gmail.com`. Leur mot de passe local est `123456`.
Ces identifiants ne sont pas destinés à un déploiement public ; créez des comptes et mots
de passe uniques avant toute mise en production.

## Base de données

`backend/.env` cible la base `pointa` sur `localhost:5432` avec l'utilisateur `postgres`.

```powershell
php .\backend\artisan migrate --seed
```

Les tests ne touchent jamais `pointa` : `phpunit.xml` pointe sur la base dédiée `pointa_test`, à créer une fois :

```sql
CREATE DATABASE pointa_test;
```

## Rôles

Administrateur, RH, Direction, Responsable, Sécurité, Personnel. Le rôle est indépendant de la structure
organisationnelle (Direction → Département → Service → Employé). Un agent de sécurité porte aussi le rôle
Personnel : il dispose donc de son espace sécurité et de son espace personnel.

## Modules API

Le point de calcul du pointage est `AttendanceService`, alimenté par les événements bruts
(`attendance_events`) et l'horaire applicable (`ScheduleService`). Les demandes de congé, permission et
absence suivent un circuit de validation configurable (`approval_workflows` / `approval_steps`) et
l'historique est conservé dans `approval_actions`.

```text
/api/v1/auth            login, logout, user
/api/v1/dashboard       organisation, personnel, validations en attente
/api/v1/employees       CRUD, pointage d'un employé
/api/v1/directions      directions, départements, services, postes
/api/v1/attendance      scan, scans, today, events, recompute, anomalies
/api/v1/leaves          congés        /api/v1/permissions  permissions
/api/v1/absences        absences      /api/v1/approvals     validations
/api/v1/planning        réunions et événements
/api/v1/schedules       horaires, affectations, jours fériés
/api/v1/reports         quotidien, mensuel, par département
/api/v1/notifications   liste, marquage lu
/api/v1/audit-logs      journal d'audit
```

## Tests

```powershell
php .\backend\artisan test
vendor\bin\pint
```
