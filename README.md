# Maroc Sport Hub

Welcome to **Maroc Sport Hub**, the ultimate platform to discover, map, and manage sports facilities across Morocco. This application is built with a modern, powerful, and scalable tech stack, designed to provide a seamless experience for both users and administrators.

## Tech Stack

This project is built with a curated set of modern technologies:

*   **Framework**: [Next.js](https://nextjs.org/) (with App Router)
*   **Backend & Database**: [Firebase](https://firebase.google.com/) (Firestore for database, Firebase Authentication for users)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **UI Components**: [ShadCN UI](https://ui.shadcn.com/)
*   **Mapping**: [Leaflet](https://leafletjs.com/) & [React-Leaflet](https://react-leaflet.js.org/)
*   **Internationalization (i18n)**: [next-intl](https://next-intl-docs.vercel.app/)
*   **Deployment**: Optimized for [Vercel](https://vercel.com/)

## Key Features

*   **Interactive Map**: Browse sports facilities across Morocco on an interactive map.
*   **Advanced Filtering**: Filter facilities by sport, region, equipment, and other criteria.
*   **User Authentication**: Secure sign-up and login with Email/Password and Google.
*   **Admin Dashboard**: A powerful dashboard for administrators to manage users, facilities, and requests.
*   **User Contributions**: Users can submit new facilities for admin approval.
*   **Multi-language Support**: The interface is available in French, English, and Arabic.
*   **Responsive Design**: Fully functional on desktop, tablet, and mobile devices.

## Getting Started

To run the project locally, follow these steps:

1.  **Clone the repository**:
    ```bash
    git clone <your-repository-url>
    cd <your-project-directory>
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Set up environment variables**:
    Copy `.env.local.example` to `.env.local` and fill in your Firebase and EmailJS credentials:
    ```bash
    cp .env.local.example .env.local
    ```
    
    **Firebase Setup**:
    - Go to [Firebase Console](https://console.firebase.google.com/)
    - Create a new project or use an existing one
    - Add your Firebase config values to `.env.local`
    
    **EmailJS Setup (for contact form)**:
    - Sign up at [EmailJS](https://www.emailjs.com/)
    - Create a service and email template
    - Add your EmailJS credentials to `.env.local`
    - Note: The contact form will work in demo mode without EmailJS, but won't send actual emails

4.  **Run the development server**:
    ```bash
    npm run dev
    ```
    Open [http://localhost:9002](http://localhost:9002) with your browser to see the result.

## Deployment on Vercel

This application is optimized for a seamless deployment on Vercel, which offers a generous free tier.

1.  **Push to a Git Repository**:
    Make sure your project is on a Git provider like GitHub, GitLab, or Bitbucket.

2.  **Import to Vercel**:
    *   Sign up or log in to [Vercel](https://vercel.com).
    *   Click on "Add New... > Project" from your dashboard.
    *   Import the Git repository containing your project.

3.  **Deploy**:
    *   Vercel will automatically detect that this is a Next.js project and pre-configure all the necessary settings.
    *   You do **not** need to set up any environment variables on Vercel, as the Firebase configuration is client-side and already included in the build.
    *   Click the **"Deploy"** button.

That's it! Vercel will build and deploy your application, providing you with a live URL. All future pushes to your main branch will trigger automatic redeployments.
