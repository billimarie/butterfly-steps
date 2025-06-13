
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import StreakDisplayModal from '@/components/dashboard/StreakDisplayModal';
import DailyGoalMetModal from '@/components/modals/DailyGoalMetModal';
import BadgeDetailModalRenderer from '@/components/profile/BadgeDetailModalRenderer'; // Renamed for clarity
import FloatingLogStepsButton from '@/components/modals/FloatingLogStepsButton';

export const metadata: Metadata = {
  title: 'Butterfly Steps',
  description: 'Butterfly Steps is a fundraising walking challenge by the nonprofit ecofarm, For Every Star, A Tree.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased min-h-screen flex flex-col">
        <AuthProvider>
          <Navbar />
          <main className="flex-grow container mx-auto px-4 py-8">
            {children}
          </main>
          <Footer />
          <Toaster />
          <StreakDisplayModal />
          <DailyGoalMetModal />
          <BadgeDetailModalRenderer /> {/* Render the modal that shows newly earned badges */}
          <FloatingLogStepsButton />
        </AuthProvider>
      </body>
    </html>
  );
}
