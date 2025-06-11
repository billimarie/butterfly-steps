
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
import { User, LogOut, Settings, LayoutDashboard, Gift, Users } from 'lucide-react'; // Added Users for Teams

export default function Navbar() {
  const { user, userProfile, logout, loading } = useAuth();

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <header className="bg-background/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
      <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Logo />
        <div className="flex items-center space-x-2 md:space-x-4">
          {loading ? (
            <div className="h-8 w-20 bg-muted rounded animate-pulse"></div>
          ) : user ? (
            <>
              <Button variant="ghost" asChild className="hidden sm:inline-flex">
                <Link href="/">Dashboard</Link>
              </Button>
              <Button variant="ghost" asChild className="hidden sm:inline-flex">
                <Link href="/teams">Teams</Link>
              </Button>
              <Button variant="ghost" asChild className="hidden md:inline-flex">
                <Link href="/invite">Generate Invite</Link>
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
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/"><LayoutDashboard className="mr-2 h-4 w-4" />Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile"><User className="mr-2 h-4 w-4" />Profile</Link>
                  </DropdownMenuItem>
                   <DropdownMenuItem asChild>
                    <Link href="/teams"><Users className="mr-2 h-4 w-4" />Teams</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/invite"><Gift className="mr-2 h-4 w-4" />Invite Message</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>
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
              <Button asChild>
                <Link href="/signup">Sign Up</Link>
              </Button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
