# work

## Task Overview

I built a small Angular job application tracker with two main screens: an Applications page to create/edit/delete applications, and a Calendar page to visualize key dates (applied / interview / deadline). Data is stored locally (localStorage) so the app keeps state across refreshes.

Main things I implemented:
- Basic app (top navigation) with Angular routing between Applications and Calendar.
- A reactive data layer (service) that exposes an observable list of applications and persists updates to localStorage.
- CRUD flow: list all applications, add a new one, edit an existing one, delete with confirmation.
- Calendar grid (month view) that shows events per day and highlights upcoming interviews/deadlines.

## Easy Tasks

- Setting up routing between pages (redirect, list route, new/edit route, calendar route).
- Creating the basic page layouts and reusable button/link styles.
- Basic localStorage persistence (save/load JSON) once the data model and service structure were in place.

## Challenging Parts

- Keeping the in-memory state (RxJS BehaviorSubject) and localStorage perfectly in sync without causing weird UI states.
- Making the stored data resilient (handling empty storage, invalid JSON, and normalizing stored objects so the UI doesn’t break).
- Implementing the calendar without a library:
	- generating a 6x7 grid aligned to Monday,
	- navigating months,
	- mapping applications to day-based events,
	- highlighting “upcoming” dates consistently based on today.

## Extra Features (Bonus)

- “Upcoming” indicators:
	- On the Applications list: small badges like “Deadline in Xd” / “Interview in Xd”.
	- On the Calendar: day cells and events get highlighted when the date is within the next 7 days.
- Calendar usability: a “Jump to date” input to quickly navigate to a specific month/day.
