# LeadFlow CRM - Backend API Documentation

This documentation describes the HTTP endpoints of the LeadFlow backend REST API. It is aligned with the active codebase, including database schemas, routing controllers, and validation rules.

---

## Table of Contents
1. [General Configuration](#general-configuration)
2. [Authentication Endpoints](#authentication-endpoints)
3. [Admin Console Endpoints](#admin-console-endpoints)
4. [Leads Management Endpoints](#leads-management-endpoints)
5. [Company (Entreprise) Endpoints](#company-entreprise-endpoints)
6. [Task (Tâche) Endpoints](#task-tâche-endpoints)
7. [Quote (Devis) Endpoints](#quote-devis-endpoints)
8. [Notification Endpoints](#notification-endpoints)
9. [KPIs Dashboard Endpoints](#kpis-dashboard-endpoints)

---

## General Configuration

*   **Base URL:** `http://localhost:3000/api` (default port is `3000`, configurable via `PORT` in `.env`).
*   **Content Type:** Request bodies should be sent as `application/json`.
*   **Authorization:** Endpoints (except `/auth/login` and `/auth/register`) require authentication via a JWT bearer token passed in the header:
    ```http
    Authorization: Bearer <your_jwt_token>
    ```

---

## Authentication Endpoints

### 1. Log In
Authenticates user credentials and returns a JWT session token.

*   **URL:** `/auth/login`
*   **Method:** `POST`
*   **Request Body:**
    ```json
    {
      "username": "user@example.com",
      "password": "user123"
    }
    ```
    *(Note: You can log in using either the email or the username prefix. Username is case-insensitive).*
*   **Success Response (200 OK):**
    ```json
    {
      "token": "eyJhbGciOiJIUzI1NiIsIn...",
      "user": {
        "id": 1,
        "username": "Alex Martin",
        "email": "alex.martin@example.com",
        "role": "commercial",
        "status": "active"
      }
    }
    ```
    *Roles are mapped from database values to frontend strings:*
    *   `Administrateur` ➔ `admin`
    *   `Manager` ➔ `manager`
    *   `Commercial` ➔ `commercial`
    *   `AgentMarketing` ➔ `marketing`
*   **Error Response (401 Unauthorized):**
    ```json
    {
      "error": "Invalid credentials."
    }
    ```

### 2. Register (Self-Service)
Registers a new commercial or user account.

*   **URL:** `/auth/register`
*   **Method:** `POST`
*   **Request Body:**
    ```json
    {
      "username": "John Doe",
      "email": "john.doe@example.com",
      "password": "securepassword",
      "role": "commercial" 
    }
    ```
    *(Available roles: `admin`, `manager`, `commercial`, `marketing`)*
*   **Success Response (201 Created):**
    ```json
    {
      "token": "eyJhbGciOiJIUzI1NiIsIn...",
      "user": {
        "id": 5,
        "username": "John Doe",
        "email": "john.doe@example.com",
        "role": "commercial",
        "status": "active"
      }
    }
    ```

### 3. Log Out
Logs out the current session and registers the action in the security audit logs.

*   **URL:** `/auth/logout`
*   **Method:** `POST`
*   **Headers:** `Authorization: Bearer <token>`
*   **Success Response (200 OK):**
    ```json
    {
      "message": "Logged out successfully."
    }
    ```

### 4. Check Session (Me)
Checks the token validity and returns profile info of the logged-in user.

*   **URL:** `/auth/me`
*   **Method:** `GET`
*   **Headers:** `Authorization: Bearer <token>`
*   **Success Response (200 OK):**
    ```json
    {
      "id": 1,
      "username": "Alex Martin",
      "email": "alex.martin@example.com",
      "role": "commercial",
      "status": "active"
    }
    ```

---

## Admin Console Endpoints
*Requires Admin privileges (`role: 'admin'`).*

### 1. List Users
Returns a list of all user profiles registered in the system database.

*   **URL:** `/admin/users`
*   **Method:** `GET`
*   **Success Response (200 OK):**
    ```json
    [
      {
        "id": 1,
        "username": "Alex Martin",
        "email": "alex.martin@example.com",
        "role": "commercial",
        "status": "active",
        "createdAt": "2026-07-27T10:00:00.000Z"
      }
    ]
    ```

### 2. Create User Profile
Creates and registers a new user profile.

*   **URL:** `/admin/users`
*   **Method:** `POST`
*   **Request Body:**
    ```json
    {
      "username": "Jean Dupont",
      "email": "jean.dupont@example.com",
      "role": "marketing",
      "password": "jeanpassword"
    }
    ```
*   **Success Response (201 Created):**
    ```json
    {
      "id": 6,
      "username": "Jean Dupont",
      "email": "jean.dupont@example.com",
      "role": "marketing",
      "status": "active",
      "createdAt": "2026-07-27T12:00:00.000Z"
    }
    ```

### 3. Update User Profile
Modifies user fields. Password can optionally be updated (must be >= 6 characters).

*   **URL:** `/admin/users/:id`
*   **Method:** `PUT`
*   **Request Body:**
    ```json
    {
      "username": "Jean Dupont Edit",
      "email": "jean.dupont.edit@example.com",
      "role": "marketing",
      "status": "disabled", 
      "password": "newsecurepassword" 
    }
    ```
    *(Note: All fields are optional. Status values: `active` or `disabled`)*
*   **Success Response (200 OK):**
    ```json
    {
      "id": 6,
      "username": "Jean Dupont Edit",
      "email": "jean.dupont.edit@example.com",
      "role": "marketing",
      "status": "disabled"
    }
    ```

### 4. Delete User Profile
Removes the user record from the database.

*   **URL:** `/admin/users/:id`
*   **Method:** `DELETE`
*   **Success Response (200 OK):**
    ```json
    {
      "message": "User deleted successfully."
    }
    ```

### 5. Security Audit Logs
Returns the list of recorded system events.

*   **URL:** `/admin/logs`
*   **Method:** `GET`
*   **Success Response (200 OK):**
    ```json
    [
      {
        "id": 14,
        "userId": 1,
        "username": "Alex Martin",
        "action": "LOGIN",
        "details": "User logged in successfully from IP 127.0.0.1",
        "ipAddress": "127.0.0.1",
        "timestamp": "2026-07-27T10:45:00.000Z"
      }
    ]
    ```

---

## Leads Management Endpoints

### 1. List Leads
Fetches lead records. List access limits are applied automatically:
*   **Admins & Marketing:** Full system view.
*   **Managers:** Full system access.
*   **Commercials:** Scoped exclusively to leads assigned to them (`commercialId === userId`).

*   **URL:** `/leads`
*   **Method:** `GET`
*   **Query Parameters (Optional):**
    *   `source`: Filter by source name
    *   `statut`: Filter by pipeline status
    *   `priorite`: Filter by priority level
    *   `search`: Search text matching name, email, or company name
*   **Success Response (200 OK):**
    ```json
    [
      {
        "id": 12,
        "nom": "Durand",
        "prenom": "Pierre",
        "telephone": "0600000001",
        "email": "pierre.durand@example.com",
        "adresse": "45 Avenue de la Marne",
        "ville": "Paris",
        "pays": "France",
        "source": "SiteWeb",
        "statut": "Nouveau",
        "priorite": "Haute",
        "score": 85,
        "valeurEstimee": 25000.00,
        "notes": "Intéressé par offre premium",
        "entrepriseId": 2,
        "commercialId": 13,
        "dateCreation": "2026-07-27T10:00:00.000Z",
        "derniereActivite": "2026-07-27T11:00:00.000Z",
        "entrepriseNom": "TechCorp",
        "commercialNomComplet": "Alex Martin"
      }
    ]
    ```

### 2. Create Lead
Creates a new lead.

*   **URL:** `/leads`
*   **Method:** `POST`
*   **Request Body:**
    ```json
    {
      "nom": "Martin",
      "prenom": "Julie",
      "telephone": "0600000002",
      "email": "julie.martin@example.com",
      "adresse": "12 Rue de la Liberté",
      "ville": "Nantes",
      "pays": "France",
      "source": "CampagneEmailing",
      "statut": "Nouveau",
      "priorite": "Moyenne",
      "score": 60,
      "valeurEstimee": 12000.00,
      "notes": "A rappeler en début de semaine",
      "entrepriseId": null,
      "commercialId": null
    }
    ```
*   **Success Response (201 Created):**
    *   Returns the full created lead object with assigned `id`.

### 3. Update Lead Details
Modifies lead fields.

*   **URL:** `/leads/:id`
*   **Method:** `PUT`
*   **Request Body:** Fields to update.
*   **Success Response (200 OK):**
    *   Returns the updated lead object.

### 4. Delete Lead
Deletes the lead.

*   **URL:** `/leads/:id`
*   **Method:** `DELETE`
*   **Success Response (200 OK):**
    ```json
    {
      "message": "Lead supprimé avec succès."
    }
    ```

### 5. Transition Lead Status (Flow Controls)
Changes the pipeline stage state. State validations are enforced:
*   **Marketing Agents:** Can only transition Nouveau ➔ Qualification, and only for leads they created. They cannot access advanced sales stages.
*   **Commercials:** Can transition leads assigned to them.
*   **Standard Allowed Transitions:**
    *   `Nouveau` ➔ `PremierContact`, `Qualification`
    *   `PremierContact` ➔ `Qualification`
    *   `Qualification` ➔ `PropositionCommerciale`
    *   `PropositionCommerciale` ➔ `Negociation`
    *   `Negociation` ➔ `Gagne`, `Perdu`

*   **URL:** `/leads/:id/status`
*   **Method:** `PATCH`
*   **Request Body:**
    ```json
    {
      "statut": "Qualification"
    }
    ```
*   **Success Response (200 OK):**
    *   Returns the updated lead object with the new status.
*   **Error Response (403 Forbidden):**
    ```json
    {
      "error": "Accès refusé. Vous n'êtes pas le créateur de ce lead et il n'est pas disponible pour qualification."
    }
    ```

### 6. Assign Lead
Assigns a lead to a sales executive (commercial). Only Admins or Managers can assign.

*   **URL:** `/leads/:id/assign`
*   **Method:** `POST`
*   **Request Body:**
    ```json
    {
      "commercialId": 13
    }
    ```
*   **Success Response (200 OK):**
    *   Returns the updated lead object.

### 7. Get Lead Activities
Retrieves the logged interactions, manual notes, and transitions history for a lead.

*   **URL:** `/leads/:id/activities`
*   **Method:** `GET`
*   **Success Response (200 OK):**
    ```json
    [
      {
        "id": 45,
        "type": "Note",
        "description": "Lead créé",
        "leadId": 12,
        "utilisateurId": 6,
        "dateCreation": "2026-07-27T10:00:00.000Z",
        "utilisateurNomComplet": "Jean Dupont"
      }
    ]
    ```

### 8. Log Lead Activity
Logs a manual interaction (Appel, Email, RendezVous, Note) on a lead.

*   **URL:** `/leads/:id/activities`
*   **Method:** `POST`
*   **Request Body:**
    ```json
    {
      "type": "Appel",
      "description": "Appel téléphonique effectué. Intérêt confirmé."
    }
    ```
    *(Allowed types: `Appel`, `Email`, `RendezVous`, `Note`)*
*   **Success Response (201 Created):**
    *   Returns the created activity object.

### 9. Get Lead Tasks
Retrieves all tasks associated with a lead.

*   **URL:** `/leads/:id/tasks`
*   **Method:** `GET`
*   **Success Response (200 OK):** Array of tasks.

### 10. Get Lead Quotes
Retrieves all devis/quotes associated with a lead.

*   **URL:** `/leads/:id/devis`
*   **Method:** `GET`
*   **Success Response (200 OK):** Array of quote objects.

---

## Company (Entreprise) Endpoints

### 1. List Companies
*   **URL:** `/entreprises`
*   **Method:** `GET`
*   **Success Response (200 OK):** Array of company objects.

### 2. Get Single Company Details
*   **URL:** `/entreprises/:id`
*   **Method:** `GET`
*   **Success Response (200 OK):**
    ```json
    {
      "id": 2,
      "nom": "TechCorp",
      "secteur": "Informatique",
      "adresse": "78 Boulevard Haussmann",
      "ville": "Paris",
      "pays": "France",
      "telephone": "0100000000",
      "siteWeb": "https://techcorp.example.com"
    }
    ```

### 3. Create Company
*   **URL:** `/entreprises`
*   **Method:** `POST`
*   **Request Body:**
    ```json
    {
      "nom": "TechCorp",
      "secteur": "Informatique",
      "siteWeb": "https://techcorp.example.com",
      "telephone": "0100000000",
      "adresse": "78 Boulevard Haussmann",
      "ville": "Paris",
      "pays": "France"
    }
    ```
*   **Success Response (201 Created):** Returns the created company object.

### 4. Update Company
*   **URL:** `/entreprises/:id`
*   **Method:** `PUT`
*   **Request Body:** Fields to update.
*   **Success Response (200 OK):** Returns the updated company object.

### 5. Delete Company
*   **URL:** `/entreprises/:id`
*   **Method:** `DELETE`
*   **Success Response (200 OK):** `{ "message": "Entreprise supprimée avec succès." }`

---

## Task (Tâche) Endpoints

### 1. Get My Active Tasks
Retrieves active tasks assigned to the currently authenticated user.

*   **URL:** `/tasks/my`
*   **Method:** `GET`
*   **Success Response (200 OK):**
    ```json
    [
      {
        "id": 8,
        "titre": "Rappeler Julie Martin",
        "description": "Lui envoyer le catalogue produit et négocier les tarifs",
        "statut": "AFaire",
        "dateEcheance": "2026-07-30T17:00:00.000Z",
        "dateCreation": "2026-07-27T11:00:00.000Z",
        "leadId": 12,
        "utilisateurId": 13,
        "leadNomComplet": "Julie Martin",
        "utilisateurNomComplet": "Alex Martin"
      }
    ]
    ```

### 2. Create Task
*   **URL:** `/tasks`
*   **Method:** `POST`
*   **Request Body:**
    ```json
    {
      "titre": "Rappeler Julie Martin",
      "description": "Lui envoyer le catalogue produit",
      "dateEcheance": "2026-07-30T17:00:00.000Z",
      "statut": "AFaire",
      "leadId": 12,
      "utilisateurId": 13
    }
    ```
    *(Statut values: `AFaire`, `EnCours`, `Termine`)*
*   **Success Response (201 Created):** Returns the created task object.

### 3. Update Task
*   **URL:** `/tasks/:id`
*   **Method:** `PUT`
*   **Request Body:** Fields to update.
*   **Success Response (200 OK):** Returns the updated task object.

### 4. Delete Task
*   **URL:** `/tasks/:id`
*   **Method:** `DELETE`
*   **Success Response (200 OK):** `{ "message": "Tâche supprimée avec succès." }`

---

## Quote (Devis) Endpoints

### 1. Create Quote
Creates a commercial quote associated with a lead. **Marketing agents are forbidden from creating quotes (returns 403).**

*   **URL:** `/devis`
*   **Method:** `POST`
*   **Request Body:**
    ```json
    {
      "reference": "DEV-2026-001",
      "montant": 15900.50,
      "statut": "Brouillon",
      "leadId": 12
    }
    ```
    *(Statut values: `Brouillon`, `Envoye`, `Accepte`, `Refuse`)*
*   **Success Response (201 Created):**
    ```json
    {
      "id": 18,
      "reference": "DEV-2026-001",
      "montant": 15900.50,
      "statut": "Brouillon",
      "leadId": 12,
      "dateCreation": "2026-07-27T12:00:00.000Z"
    }
    ```
*   **Error Response (403 Forbidden):**
    ```json
    {
      "error": "Les agents marketing ne sont pas autorisés à générer des devis."
    }
    ```

### 2. Transition Quote Status
Changes the status (e.g. Accept, Refuse, Send) of a quote.

*   **URL:** `/devis/:id/status`
*   **Method:** `PATCH`
*   **Request Body:**
    ```json
    {
      "statut": "Accepte"
    }
    ```
*   **Success Response (200 OK):** Returns the updated quote object.

---

## Notification Endpoints

### 1. List Notifications
Returns user-specific alert notifications.

*   **URL:** `/notifications`
*   **Method:** `GET`
*   **Success Response (200 OK):**
    ```json
    [
      {
        "id": 4,
        "titre": "Nouveau lead attribué",
        "message": "Le lead Julie Martin vous a été attribué.",
        "type": "info",
        "estLue": false,
        "utilisateurId": 13,
        "dateCreation": "2026-07-27T11:00:00.000Z"
      }
    ]
    ```

### 2. Mark Notification as Read
*   **URL:** `/notifications/:id/read`
*   **Method:** `PATCH`
*   **Success Response (200 OK):**
    ```json
    {
      "message": "Notification marquée comme lue."
    }
    ```

### 3. Mark All Notifications as Read
*   **URL:** `/notifications/read-all`
*   **Method:** `POST`
*   **Success Response (200 OK):**
    ```json
    {
      "message": "Toutes les notifications ont été marquées comme lues."
    }
    ```

---

## KPIs Dashboard Endpoints
*Only accessible to Admins and Managers. Commercials and Marketing agents receive a 403 Forbidden error.*

*   **URL:** `/kpis`
*   **Method:** `GET`
*   **Success Response (200 OK):**
    ```json
    {
      "global": {
        "totalLeads": 26,
        "totalEstimatedValue": 944919.13,
        "totalWonValue": 123198.94,
        "winRate": 47.38,
        "overdueTasksCount": 2
      },
      "byStatus": [
        { "statut": "Nouveau", "count": 10, "valeur": 210000.00 },
        { "statut": "Qualification", "count": 6, "valeur": 180000.00 }
      ],
      "bySource": [
        { "source": "SiteWeb", "count": 15 },
        { "source": "CampagneEmailing", "count": 11 }
      ],
      "activityLog": [
        {
          "id": 14,
          "username": "Alex Martin",
          "action": "LOGIN",
          "details": "User logged in successfully from IP 127.0.0.1",
          "timestamp": "2026-07-27T10:45:00.000Z"
        }
      ]
    }
    ```
