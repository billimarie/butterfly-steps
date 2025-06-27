
'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import Logo from '@/components/ui/Logo';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, LayoutDashboard, Gift, BarChart3, Shell, PlusCircle } from 'lucide-react';
import { CHRYSALIS_AVATAR_IDENTIFIER } from '@/types';
import { ThemeToggleButton } from '@/components/layout/ThemeToggleButton';

export default function Navbar() {
  const { user, userProfile, logout, loading, setShowLogStepsModal } = useAuth();

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    const parts = name.split(' ').map(n => n[0]).filter(Boolean);
    if (parts.length === 0) return 'U';
    return parts.join('').toUpperCase();
  };

  const profileLink = user ? `/profile/${user.uid}` : '/login';

  const renderAvatarContent = () => {
    const currentPhotoURL = userProfile?.photoURL || user?.photoURL;
    if (currentPhotoURL === CHRYSALIS_AVATAR_IDENTIFIER) {
      return <Shell className="!h-full !w-full p-1.5 text-primary" data-ai-hint="chrysalis shell gold" />;
    }
    return (
      <>
        <AvatarImage src={currentPhotoURL || undefined} alt={userProfile?.displayName || user?.email || 'User'} />
        <AvatarFallback>{getInitials(userProfile?.displayName || user?.email)}</AvatarFallback>
      </>
    );
  };

  return (
    <header className="bg-background/80 backdrop-blur-md shadow-sm sticky top-0 z-40">
      <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Logo />
        <div className="flex items-center space-x-2">
          {/* --- Desktop Navigation (hidden on mobile) --- */}
          <div className="hidden md:flex items-center space-x-2">
            <ThemeToggleButton />
            {loading ? (
              <div className="h-8 w-32 bg-muted rounded animate-pulse"></div>
            ) : user ? (
              <>
                {userProfile?.profileComplete && (
                  <Button variant="ghost" size="icon" onClick={() => setShowLogStepsModal(true, 'direct')} aria-label="Log steps">
                    <PlusCircle className="h-6 w-6" />
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10">
                        {renderAvatarContent()}
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{userProfile?.displayName || user.email}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user.email || 'No email'}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={profileLink}><User className="mr-2 h-4 w-4" />Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/?tab=dashboard"><LayoutDashboard className="mr-2 h-4 w-4" />Dashboard</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/?tab=community"><BarChart3 className="mr-2 h-4 w-4" />Community</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/donate"><Gift className="mr-2 h-4 w-4" />Donate</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild className="ml-2">
                  <Link href="/signup">Sign Up</Link>
                </Button>
              </>
            )}
          </div>
          {/* --- Mobile Header Items (just the theme toggle) --- */}
          <div className="md:hidden">
            <ThemeToggleButton />
          </div>
        </div>
      </nav>
    </header>
  );
}
