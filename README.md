# Budget Tracker

A React-based budget tracking application designed for managing expenses across multiple currencies with a secure, household-scoped database.

## Features

- **Multi-Currency Support**: Dynamic expense tracking based on your specific bank accounts (e.g., SEK, INR, USD).
- **Mobile Responsive**: Fully optimized dashboard for managing finances on the go.
- **Visual Trends**: 6-month historical spending charts with dynamic currency legends.
- **Transfer Wizard**: Easily manage transfers between primary and secondary accounts.
- **Recurring Payments**: Import and manage monthly subscription/bill templates.
- **Secure Sharing**: Household-based data scoping for secure sharing between spouses/members.

## Tech Stack

- **Frontend**: React 18 (Vite), TypeScript, Material UI (MUI) v6.
- **Backend**: Firebase (Firestore, Authentication).
- **Charts**: Recharts for historical data visualization.
- **Date Handling**: date-fns.

## Getting Started

1.  **Clone the repository**
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Environment Setup**:
    Create a `.env` file in the root directory and add your Firebase configuration:
    ```env
    VITE_FIREBASE_API_KEY=your_api_key
    VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
    VITE_FIREBASE_PROJECT_ID=your_project_id
    VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
    VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
    VITE_FIREBASE_APP_ID=your_app_id
    ```
4.  **Run development server**:
    ```bash
    npm run dev
    ```

## Deployment

This app is designed to be deployed to platforms like Vercel or Netlify.
URL: [https://budget.suveen.me](https://budget.suveen.me)

## License

MIT
