# Agent Guide: Budget Tracker

This document provides instructions for agentic coding tools operating within this repository.

## Project Overview
A React-based budget tracking application tailored for Indian expats in Sweden. It handles dual currencies (SEK/INR), bank account buffers, and complex transfer calculations.

- **Stack**: React (Vite), TypeScript, MUI v6, Firebase (Firestore/Auth).
- **Core Logic**: Hub-and-spoke currency model, smart expense pre-filling, and monthly snapshots.

## Development Commands

### Build & Lint
- `npm run dev`: Start development server.
- `npm run build`: Production build (Vite).
- `npm run lint`: Run ESLint checks.

### Testing
*Note: No testing framework currently configured in package.json. If adding tests, prefer Vitest.*
- Run single test (once configured): `npx vitest run path/to/file.test.ts`

---

## Code Style & Conventions

### 1. Typescript & Naming
- **Interfaces**: Always use `interface` for data models. Define them in `src/types/index.ts`.
- **Naming**: 
  - Components: PascalCase (e.g., `ExpenseForm.tsx`).
  - Services/Utils: camelCase (e.g., `budgetService.ts`).
  - Variables/Props: camelCase.
- **Strict Typing**: Avoid `any`. Use `Partial<T>` for forms and `Omit<T, 'id'>` for new entity creation.

### 2. File Structure
- `src/components/`: Reusable UI components.
- `src/contexts/`: React Contexts (Auth, etc.).
- `src/services/`: Firebase interaction logic (Stateless exports).
- `src/pages/`: Top-level route components.
- `src/types/`: Centralized Type Definitions.

### 3. Imports
- Group imports: React/Libraries, Local Components, Services, Types, Styles.
- Prefer absolute paths if configured, otherwise relative.
- Standard order:
  ```typescript
  import React, { useState } from 'react';
  import { Box, Button } from '@mui/material';
  import { budgetService } from '../services/budgetService';
  import { Expense } from '../types';
  ```

### 4. Component Patterns
- Use Functional Components with `React.FC`.
- Destructure props in the function signature.
- Use MUI `Box` and `Grid2` for layouts.
- Prefer `slotProps` over deprecated props (like `InputLabelProps` in MUI v6).

### 5. Firebase & Services
- **Services**: Keep services as objects with async methods.
- **Rules**: Adhere to the `householdId` security pattern. Every document must have a `householdId` field.
- **Queries**: Always filter by `householdId` in `budgetService`.

### 6. Error Handling
- Use `try...catch` in services for API calls (Currency API).
- Components should handle loading states with `CircularProgress` and display errors gracefully (e.g., via Snacker/Alert).

### 7. Formatting
- Use 2-space indentation.
- Maintain a single empty line between import groups and before the main export.

---

## Database Schema (Firestore)
- `users`: `{ uid, email, householdId }`
- `households`: `{ id, members: [], primaryAccounts: {} }`
- `bankAccounts`: `{ householdId, name, currency, minBalance, isPrimary }`
- `expenses`: `{ householdId, month, amount, currency, bankAccountId, category }`
- `categories`: `{ householdId, name }`
- `exchangeRates`: `{ date, rates: {} }`

## Common Tasks for Agents
1. **Adding Features**: Ensure the new feature respects the `householdId` filter.
2. **UI Updates**: Use MUI components consistent with the theme in `App.tsx`.
3. **Currency Logic**: Use `currencyService.ts` for any SEK/INR conversions to leverage caching.
