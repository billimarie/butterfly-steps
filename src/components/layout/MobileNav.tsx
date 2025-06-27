
'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { LayoutDashboard, BarChart3, PlusCircle, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const MobileNavItem = ({ href, icon: Icon, label, isActive, onClick }: { href?: string; icon: React.ElementType; label: string; isActive: boolean; onClick?: () => void; }) => {
  const content = (
    <div className={cn(
      "flex flex-col items-center justify-center gap-1 w-full h-full p-2 rounded-lg transition-colors",
      isActive ? "text-primary" : "text-muted-foreground hover:text-primary"
    )}>
      <Icon className="h-6 w-6" />
      <span className="text-xs">{label}</span>
    </div>
  );

  if (href) {
    return <Link href={href} className="flex-1 text-center">{content}</Link>;
  }

  return <button onClick={onClick} className="flex-1 text-center bg-transparent border-none p-0 h-full">{content}</button>;
};

export default function MobileNav() {
  const { user, userProfile, setShowLogStepsModal } = useAuth();
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (!isMobile || !user || !userProfile?.profileComplete) {
    return null;
  }

  const tab = searchParams.get('tab');
  const isDashboardActive = pathname === '/' && (tab === 'dashboard' || !tab);
  const isLeaderboardActive = pathname === '/' && tab === 'community';
  const isProfileActive = pathname === `/profile/${user.uid}`;

  const handleLogStepsClick = () => {
    setShowLogStepsModal(true, 'direct');
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-background/90 border-t border-border/50 shadow-t-lg z-50 backdrop-blur-sm">
      <nav className="flex justify-around items-center h-full px-2">
        <MobileNavItem
          href="/?tab=dashboard"
          icon={LayoutDashboard}
          label="Dashboard"
          isActive={isDashboardActive}
        />
        <MobileNavItem
          href="/?tab=community"
          icon={BarChart3}
          label="Community"
          isActive={isLeaderboardActive}
        />
        <MobileNavItem
          icon={PlusCircle}
          label="Log Steps"
          isActive={false} // This item is an action, not a page
          onClick={handleLogStepsClick}
        />
        <MobileNavItem
          href={`/profile/${user.uid}`}
          icon={User}
          label="Profile"
          isActive={isProfileActive}
        />
      </nav>
    </div>
  );
}
