
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/components/layout/ThemeProvider';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ChrysalisJourneyModal from '@/components/chrysalis/ChrysalisJourneyModal';
import DailyGoalMetModal from '@/components/modals/DailyGoalMetModal';
import BadgeDetailModalRenderer from '@/components/profile/BadgeDetailModalRenderer';
import WelcomeMigrationModal from '@/components/modals/WelcomeMigrationModal'; 
import ChallengeInvitationModalRenderer from '@/components/modals/ChallengeInvitationModalRenderer'; 
import DailyMotivationModal from '@/components/modals/DailyMotivationModal';
import MobileNav from '@/components/layout/MobileNav';
import LogStepsModal from '@/components/modals/LogStepsModal';


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
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased min-h-screen flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <Navbar />
            <main className="flex-grow container mx-auto px-4 py-8 md:pb-8 pb-24">
              {children}
            </main>
            <Footer />
            <Toaster />
            <WelcomeMigrationModal /> 
            <ChrysalisJourneyModal /> 
            <DailyGoalMetModal />
            <BadgeDetailModalRenderer />
            <ChallengeInvitationModalRenderer /> 
            <DailyMotivationModal />
            <LogStepsModal />
            
            <MobileNav />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
