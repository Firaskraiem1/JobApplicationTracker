# Job Application Tracker

An Angular app to track job applications (status + key dates) and visualize deadlines/interviews in a calendar view. Data is stored locally in the browser (localStorage).

## Project Overview

### Features
- Applications list with status and key dates (applied / interview / deadline)
- Add / edit application form (create + update)
- Delete with confirmation
- Calendar month view with event display per day
- “Upcoming” highlighting for interviews/deadlines in the next 7 days

### Tech Stack
- Angular (standalone components)
- RxJS for reactive state updates
- localStorage for persistence

## Architecture

### High-level structure
- **UI shell + routing**: the root component renders the top navigation and a `router-outlet` where pages are loaded.
- **Pages (feature UI)**: pages implement screens (list, form, calendar) and use the service as the single source of truth.
- **Data layer (service)**: a single service owns the application list in memory and persists it to localStorage.
- **Model**: a small TypeScript model defines the `JobApplication` shape used across the app.

### Routing
Routes are defined in [src/app/app.routes.ts](src/app/app.routes.ts):
- `/applications` -> list page
- `/applications/new` -> create form
- `/applications/:id/edit` -> edit form
- `/calendar` -> calendar page

### Data flow (RxJS + localStorage)
The core state is managed in [src/app/services/job-applications.service.ts](src/app/services/job-applications.service.ts):
- A `BehaviorSubject` holds the current list in memory.
- Components consume `applications$` (an `Observable`) using `AsyncPipe` (e.g. `| async`), so the UI updates automatically.
- On `create/update/remove`, the service updates the subject and persists the list to localStorage.

### Folder structure
- [src/app/models](src/app/models): TypeScript types for the domain model
- [src/app/services](src/app/services): reactive state + persistence
- [src/app/pages](src/app/pages): application screens
	- [src/app/pages/applications](src/app/pages/applications): list + form
	- [src/app/pages/calendar](src/app/pages/calendar): calendar view

## Getting Started

### Install
`npm install`

### Run (dev)
`npm start`

### Tests
`npm test`