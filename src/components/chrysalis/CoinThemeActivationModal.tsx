
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { ChrysalisVariantData } from '@/lib/chrysalisVariants';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { Palette, RefreshCw, Shell, CheckCircle, Sparkle as SparkleIconLucide, X } from 'lucide-react';
import { useState } from 'react';

interface CoinThemeActivationModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  coinVariant: ChrysalisVariantData | null;
}

const Cloud = ({ className }: { className?: string }) => (
  <div className={cn("absolute bg-white/80 rounded-full", className)}></div>
);

const Sparkle = ({ className, size = 'md' }: { className?: string, size?: 'sm' | 'md' | 'lg' }) => {
  const s = size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5';
  return <SparkleIconLucide className={cn("absolute text-yellow-300 opacity-90", s, className)} data-ai-hint="sparkle decoration"/>;
};

export default function CoinThemeActivationModal({ isOpen, onOpenChange, coinVariant }: CoinThemeActivationModalProps) {
  const { activateThemeFromCollectedCoin, userProfile } = useAuth();
  const [isActivating, setIsActivating] = useState(false);

  if (!coinVariant) return null;

  const CoinIcon = coinVariant.icon || Shell;
  const isCurrentlyActive = userProfile?.activeChrysalisThemeId === coinVariant.id && userProfile?.photoURL?.includes('chrysalis');

  const handleActivate = async () => {
    if (!coinVariant) return;
    setIsActivating(true);
    await activateThemeFromCollectedCoin(coinVariant, true); // fromProfileActivation = true
    setIsActivating(false);
    onOpenChange(false);
  };

  const dynamicHeaderStyle: React.CSSProperties = {
    background: `linear-gradient(to bottom right, hsl(${coinVariant.themePrimaryHSL}), hsl(${coinVariant.themeAccentHSL}))`,
  };
  
  const dynamicTitleStyle: React.CSSProperties = {
    color: `hsl(${coinVariant.themePrimaryForegroundHSL})`,
  };

  const dynamicDescriptionStyle: React.CSSProperties = {
      color: `hsl(${coinVariant.themePrimaryForegroundHSL}, 0.9)` 
  };

  const dynamicActionButtonStyle: React.CSSProperties = {
    backgroundColor: `hsl(${coinVariant.themePrimaryHSL})`,
    color: `hsl(${coinVariant.themePrimaryForegroundHSL})`,
    borderColor: `hsl(${coinVariant.themePrimaryHSL})`
  };
  const dynamicActionButtonHoverStyle: React.CSSProperties = {
    backgroundColor: `hsl(${coinVariant.themePrimaryHSL.split(' ')[0]} ${coinVariant.themePrimaryHSL.split(' ')[1]} ${Math.max(0, parseFloat(coinVariant.themePrimaryHSL.split(' ')[2]) - 10)}%)`,
  };

  let ActionButton: React.ReactNode;
  if (isCurrentlyActive) {
    ActionButton = (
      <div className="flex items-center text-sm font-semibold order-1 sm:order-2" style={{color: `hsl(${coinVariant.themePrimaryHSL})`}}>
        <CheckCircle className="mr-2 h-5 w-5" />
        Theme is Active
      </div>
    );
  } else {
    ActionButton = (
      <Button 
        onClick={handleActivate} 
        disabled={isActivating} 
        className="order-1 sm:order-2 w-full sm:w-auto transition-colors duration-150 ease-in-out"
        style={isActivating ? {} : dynamicActionButtonStyle}
        onMouseEnter={e => {
          if(!isActivating) Object.assign(e.currentTarget.style, dynamicActionButtonHoverStyle);
        }}
        onMouseLeave={e => {
           if(!isActivating) Object.assign(e.currentTarget.style, dynamicActionButtonStyle);
        }}
      >
        {isActivating ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Palette className="mr-2 h-4 w-4" />}
        Activate Theme
      </Button>
    );
  }


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden shadow-2xl rounded-lg">
         <DialogHeader
          className="relative w-full aspect-[4/5] flex flex-col items-center justify-around p-6 text-white rounded-t-lg !space-y-0 overflow-hidden"
          style={dynamicHeaderStyle}
        >
            <Cloud className="w-20 h-10 top-16 -left-5 opacity-50" />
            <Cloud className="w-28 h-14 top-24 -right-10 opacity-40" />
            <Cloud className="w-16 h-8 bottom-32 -left-3 opacity-30" />
            <Cloud className="w-24 h-12 bottom-20 -right-8 opacity-35" />

            <Sparkle className="top-10 left-8 transform rotate-12" size="lg" />
            <Sparkle className="top-20 right-6 transform -rotate-15" size="md" />
            <Sparkle className="top-1/2 left-5 transform rotate-5" size="sm" />
            <Sparkle className="top-1/3 right-10 transform rotate-20" size="md" />
            <Sparkle className="bottom-1/4 left-10 transform -rotate-10" size="lg" />
            <Sparkle className="bottom-12 right-12 transform rotate-25" size="sm" />

            <DialogTitle className="text-center z-10" style={dynamicTitleStyle}>
              <span className="text-4xl font-bold tracking-wider">DAY {coinVariant.dayNumber}</span>
            </DialogTitle>

            <div className="relative z-10 my-1">
              <div className="w-36 h-36 md:w-40 md:h-40 bg-gradient-to-br from-yellow-300 to-yellow-400 rounded-full shadow-2xl flex items-center justify-center border-8 border-yellow-400 ring-4 ring-orange-700/10 ring-inset">
                  <CoinIcon className="w-20 h-20 md:w-24 md:h-24" style={{ color: `hsl(${coinVariant.themePrimaryHSL})` }} data-ai-hint={coinVariant.name.toLowerCase().includes("shell") ? "chrysalis shell" : "icon nature"} />
              </div>
            </div>

            <DialogDescription className="text-center z-10" style={dynamicDescriptionStyle}>
              <span className="block text-3xl font-semibold text-white">{coinVariant.name}</span>
            </DialogDescription>
        </DialogHeader>

        <div className="pt-6 pb-6 px-6 space-y-4 text-center">
          <p className="text-muted-foreground text-base">
            {coinVariant.description}
          </p>
        </div>

        <DialogFooter className="px-6 py-4 bg-muted/20 border-t rounded-b-lg flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button onClick={() => onOpenChange(false)} variant="outline" className="order-2 sm:order-1 w-full sm:w-auto">Close</Button>
          {ActionButton}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
