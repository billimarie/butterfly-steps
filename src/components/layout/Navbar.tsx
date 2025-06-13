
'use client';

import { useState } from 'react';
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
import { Menu, X, User, LogOut, LayoutDashboard, Gift, Users, ShoppingCart } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

export default function Navbar() {
  const { user, userProfile, logout, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    const parts = name.split(' ').map(n => n[0]).filter(Boolean);
    if (parts.length === 0) return 'U';
    return parts.join('').toUpperCase();
  };

  return (
    <header className="bg-background/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
      <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Logo />

        <div className="flex items-center space-x-2">
          {isMobile ? (
            // Mobile View: Avatar or Hamburger toggle
            loading ? (
              <div className="h-9 w-9 bg-muted rounded-full animate-pulse"></div>
            ) : user ? (
              <Button
                variant="ghost"
                className="relative h-9 w-9 rounded-full p-0"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle Mobile Menu"
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user.photoURL || undefined} alt={userProfile?.displayName || user.email || 'User'} />
                  <AvatarFallback>{getInitials(userProfile?.displayName || user.email)}</AvatarFallback>
                </Avatar>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild className="p-1.5 text-muted-foreground hover:text-primary">
                  <Link href="/shop"><ShoppingCart className="w-6 h-6" /></Link>
                </Button>
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
            )
          ) : (
            // Desktop View: Full navigation
            loading ? (
              <div className="h-8 w-24 bg-muted rounded animate-pulse"></div>
            ) : user ? (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/feed">Feed</Link>
                </Button>
                <Button variant="ghost" asChild>
                  <Link href="/shop">Shop</Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.photoURL || undefined} alt={userProfile?.displayName || user.email || 'User'} />
                        <AvatarFallback>{getInitials(userProfile?.displayName || user.email)}</AvatarFallback>
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
                      <Link href="/"><LayoutDashboard className="mr-2 h-4 w-4" />Your Dashboard</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                    {userProfile.teamId && userProfile.teamName ? (
                      <Link href={`/teams/${userProfile.teamId}`} onClick={() => setMobileMenuOpen(false)} className="block">
                        <Users className="mr-3 h-5 w-5" />{userProfile.teamName}
                      </Link>
                      ) : (
                        <Link href="/teams" onClick={() => setMobileMenuOpen(false)} className="block">
                          <Users className="mr-3 h-5 w-5" />Team Hub
                        </Link>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/profile"><User className="mr-2 h-4 w-4" />Profile</Link>
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
                <Button variant="ghost" asChild className="p-1.5 text-muted-foreground hover:text-primary">
                  <Link href="/shop"><ShoppingCart className="w-6 h-6" /></Link>
                </Button>
                <Button asChild className="ml-2">
                  <Link href="/signup">Sign Up</Link>
                </Button>
              </>
            )
          )}
        </div>

        {/* Mobile Menu Content - slides down */}
        {isMobile && mobileMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-background shadow-lg border-t border-border z-40">
            <div className="container mx-auto px-4 py-3 flex flex-col gap-1">
              {loading ? (
                <div className="h-8 w-full bg-muted rounded animate-pulse my-1"></div>
              ) : user ? (
                <>
                  <Link href="/" onClick={() => setMobileMenuOpen(false)} className="block">
                    <Button variant="ghost" className="w-full justify-start text-base py-3"><LayoutDashboard className="mr-3 h-5 w-5" />Your Dashboard</Button>
                  </Link>
                  {userProfile.teamId && userProfile.teamName ? (
                  <Link href={`/teams/${userProfile.teamId}`} onClick={() => setMobileMenuOpen(false)} className="block">
                    <Button variant="ghost" className="w-full justify-start text-base py-3"><Users className="mr-3 h-5 w-5" />{userProfile.teamName}</Button>
                  </Link>
                  ) : (
                    <Link href="/teams" onClick={() => setMobileMenuOpen(false)} className="block">
                      <Button variant="ghost" className="w-full justify-start text-base py-3"><Users className="mr-3 h-5 w-5" />Team Hub</Button>
                    </Link>
                  )}
                  <Link href="/feed" onClick={() => setMobileMenuOpen(false)} className="block">
                    <Button variant="ghost" className="w-full justify-start text-base py-3"><LayoutDashboard className="mr-3 h-5 w-5" />Feed</Button>
                  </Link>
                  <Link href="/shop" onClick={() => setMobileMenuOpen(false)} className="block">
                    <Button variant="ghost" className="w-full justify-start text-base py-3"><ShoppingCart className="mr-3 h-5 w-5" />Shop</Button>
                  </Link>
                  <Link href="/profile" onClick={() => setMobileMenuOpen(false)} className="block">
                    <Button variant="ghost" className="w-full justify-start text-base py-3"><User className="mr-3 h-5 w-5" />Profile</Button>
                  </Link>
                  <DropdownMenuSeparator className="my-1"/>
                  <Button variant="ghost" onClick={() => { logout(); setMobileMenuOpen(false); }} className="w-full justify-start text-base py-3 text-destructive hover:text-destructive focus:bg-destructive/10 focus:text-destructive">
                    <LogOut className="mr-3 h-5 w-5" />Log out
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/feed" onClick={() => setMobileMenuOpen(false)} className="block">
                    <Button variant="ghost" className="w-full justify-start text-base py-3"><Users className="mr-3 h-5 w-5" />Community Feed</Button>
                  </Link>
                  <Link href="/shop" onClick={() => setMobileMenuOpen(false)} className="block">
                    <Button variant="ghost" className="w-full justify-start text-base py-3"><ShoppingCart className="mr-3 h-5 w-5" />Shop</Button>
                  </Link>
                  <DropdownMenuSeparator className="my-1"/>
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="block">
                    <Button variant="ghost" className="w-full justify-start text-base py-3">Login</Button>
                  </Link>
                  <Link href="/signup" onClick={() => setMobileMenuOpen(false)} className="block">
                    <Button className="w-full text-base py-3 mt-1">Sign Up</Button>
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
