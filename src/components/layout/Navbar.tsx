
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import Logo from '@/components/ui/Logo';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import StepSubmissionForm from '@/components/dashboard/StepSubmissionForm';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, X, User, LogOut, LayoutDashboard, ShoppingCart, Plus, Settings as SettingsIcon, BarChart3, Shell } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const CHRYSALIS_AVATAR_IDENTIFIER = 'lucide:shell';

export default function Navbar() {
  const { user, userProfile, logout, loading, fetchUserProfile } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logStepsNavbarModalOpen, setLogStepsNavbarModalOpen] = useState(false);
  const isMobile = useIsMobile();

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    const parts = name.split(' ').map(n => n[0]).filter(Boolean);
    if (parts.length === 0) return 'U';
    return parts.join('').toUpperCase();
  };

  const profileLink = user ? `/profile/${user.uid}` : '/login';

  const handleNavbarStepSubmitSuccess = async () => {
    if (user?.uid) {
      await fetchUserProfile(user.uid);
    }
    setLogStepsNavbarModalOpen(false);
  };

  const LogStepsButton = () => (
    user && userProfile?.profileComplete && (
      <Dialog open={logStepsNavbarModalOpen} onOpenChange={setLogStepsNavbarModalOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full text-muted-foreground hover:text-primary hover:bg-accent"
            aria-label="Log Steps"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md p-0">
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle className="font-headline text-2xl">Log Your Steps</DialogTitle>
            <DialogClose asChild>
            </DialogClose>
          </DialogHeader>
          <div className="px-6 py-2">
            <StepSubmissionForm onStepSubmit={handleNavbarStepSubmitSuccess} isModalVersion={true} />
          </div>
        </DialogContent>
      </Dialog>
    )
  );

  const renderAvatarContent = () => {
    // Check userProfile.photoURL first (from Firestore), then user.photoURL (from Firebase Auth)
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
    <header className="bg-background/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
      <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Logo />

        <div className="flex items-center space-x-2">
          {isMobile ? (
            // Mobile View
            <>
              <LogStepsButton />
              {loading ? (
                <div className="h-9 w-9 bg-muted rounded-full animate-pulse"></div>
              ) : user ? (
                <Button
                  variant="ghost"
                  className="relative h-9 w-9 rounded-full p-0"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  aria-label="Toggle Mobile Menu"
                >
                  <Avatar className="h-9 w-9">
                    {renderAvatarContent()}
                  </Avatar>
                </Button>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-muted-foreground hover:text-primary"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    aria-label="Toggle Mobile Menu"
                  >
                    {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                  </Button>
                </>
              )}
            </>
          ) : (
            // Desktop View
            loading ? (
              <div className="h-8 w-32 bg-muted rounded animate-pulse"></div>
            ) : user ? (
              <>
                <LogStepsButton />
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
                      <Link href="/?tab=community"><BarChart3 className="mr-2 h-4 w-4" />Leaderboard</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/shop"><ShoppingCart className="mr-2 h-4 w-4" />Shop</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings"><SettingsIcon className="mr-2 h-4 w-4" />Settings</Link>
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
            )
          )}
        </div>

        {isMobile && mobileMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-background shadow-lg border-t border-border z-40">
            <div className="container mx-auto px-4 py-3 flex flex-col gap-1">
              {loading ? (
                <div className="h-8 w-full bg-muted rounded animate-pulse my-1"></div>
              ) : user ? (
                <>
                  <Link href={profileLink} onClick={() => setMobileMenuOpen(false)} className="block">
                    <Button variant="ghost" className="w-full justify-start text-base py-3"><User className="mr-3 h-5 w-5" />Profile</Button>
                  </Link>
                  <Link href="/?tab=dashboard" onClick={() => setMobileMenuOpen(false)} className="block">
                    <Button variant="ghost" className="w-full justify-start text-base py-3"><LayoutDashboard className="mr-3 h-5 w-5" />Dashboard</Button>
                  </Link>
                  <Link href="/?tab=community" onClick={() => setMobileMenuOpen(false)} className="block">
                    <Button variant="ghost" className="w-full justify-start text-base py-3"><BarChart3 className="mr-3 h-5 w-5" />Leaderboard</Button>
                  </Link>
                  <Link href="/shop" onClick={() => setMobileMenuOpen(false)} className="block">
                    <Button variant="ghost" className="w-full justify-start text-base py-3"><ShoppingCart className="mr-3 h-5 w-5" />Shop</Button>
                  </Link>
                  <Link href="/settings" onClick={() => setMobileMenuOpen(false)} className="block">
                    <Button variant="ghost" className="w-full justify-start text-base py-3"><SettingsIcon className="mr-3 h-5 w-5" />Settings</Button>
                  </Link>
                  <DropdownMenuSeparator className="my-1"/>
                  <Button variant="ghost" onClick={() => { logout(); setMobileMenuOpen(false); }} className="w-full justify-start text-base py-3 text-destructive hover:text-destructive focus:bg-destructive/10 focus:text-destructive">
                    <LogOut className="mr-3 h-5 w-5" />Log out
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="block">
                    <Button className="w-full text-base py-3 bg-primary">Login</Button>
                  </Link>
                  <Link href="/signup" onClick={() => setMobileMenuOpen(false)} className="block">
                    <Button variant="ghost" className="w-full text-base py-3 mt-1">Sign Up</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
