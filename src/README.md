# 📁 `src` Folder Structure

```
src/
│
├── assets/              # Fonts, images, and static assets
├── components/          # Reusable UI components
│   ├── buttons/
│   ├── cards/
│   ├── charts/
│   ├── inputs/
│   ├── layouts/
│   ├── modals/
│   ├── shared/          # Tiny atomic components used across other components
│   └── tables/
│
├── context/             # React context providers (e.g. AuthContext)
├── data/                # Local JSON or static data
│   └── mocks/           # Temporary mock data for testing UI
│
├── features/            # Domain-specific logic split by feature (e.g. labs, users)
├── hooks/               # Custom React hooks
├── lib/                 # Setup code (e.g. Apollo client, i18n, config)
├── pages/               # Top-level pages (tied to routing)
├── services/            # External services, API calls
└── utils/               # Helper functions, formatters, etc.
```

# 📁 `src` Folder Overview

#### This directory contains the main source code for the application.

---

### 📁 `assets/`

Static files like fonts, images, and other media used across the app. Organize into subfolders like `fonts/`, `images/`, etc.

---

### 📁 `components/`

Reusable UI components organized by type or usage.

- 📂 `buttons/` — Button components such as `PrimaryButton`, `IconButton`, etc.
- 📂 `cards/` — Visual containers for grouping content, e.g. `UserCard`, `ProjectCard`.
- 📂 `charts/` — Chart and graph components, possibly wrapping libraries like Recharts or Chart.js.
- 📂 `inputs/` — Form input components like `TextInput`, `Select`, `Checkbox`, etc.
- 📂 `layouts/` — Top-level layout wrappers like `MainLayout`, `LabLayout`. These define structure across pages.
- 📂 `modals/` — Dialog windows and overlays, including `ConfirmationModal`, `EditModal`, etc.
- 📂 `shared/` — Tiny generic components like `Avatar`, `Loader`, `Divider` — often used inside other components.
- 📂 `tables/` — Table components like `DataTable`, `SortableTable`, and related utilities.

---

### 📁 `context/`

Houses global React context providers such as `AuthContext` or `ThemeContext`. Each context lives in its own folder, including:

- The context definition
- Its provider component
- Any context-specific hooks (e.g. `useAuth`, `useTheme`)
- Type definitions, if applicable

This ensures all logic related to a specific global context is encapsulated together.

---

### 📁 `data/`

Static or mock data used to populate UI or simulate API responses during development.

- 📂 `mocks/` — Temporary mock responses used before integrating real APIs.

---

### 📁 `features/`

Domain-specific folders containing feature logic, views, and components grouped by functionality (e.g., `labs/`, `users/`). Use this to encapsulate all parts of a feature in one place.

---

### 📁 `hooks/`

Reusable utility hooks that are **not tied to a specific context**. Examples:

- `useDebounce`
- `useMediaQuery`
- `useLocalStorage`

These are generic helpers that can be used anywhere in the app.

---

### 📁 `lib/`

Library setup code and one-off utilities, such as:

- Apollo client setup (`apolloClient.ts`)
- Theme configurations
- Internationalization (`i18n.ts`)
- Analytics or telemetry setup

---

### 📁 `pages/`

Top-level route components. Each file corresponds to a route.

---

### 📁 `services/`

Abstracted services for API calls, authentication, or external integrations (e.g., `authService`, `apiService`).

---

### 📁 `utils/`

Generic helper functions like formatters, validators, or math utilities. Should not depend on UI code.

---

### 📄 Other Root Files

- `App.tsx`: The root component for the application.
- `main.tsx`: Entry point that mounts the app and wraps it in global providers.
- `index.css`, `App.css`: Global or App-wide styles.
- `vite-env.d.ts`: Vite-specific TypeScript environment definitions.
- `README.md`: This file.

---

> This project follows a feature-based architecture inspired by [Web Dev Simplified](https://blog.webdevsimplified.com/2022-07/react-folder-structure/). Components and logic are grouped by feature when possible, and shared utilities live in top-level folders.
