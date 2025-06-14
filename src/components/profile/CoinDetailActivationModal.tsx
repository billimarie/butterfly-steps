
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { ChrysalisVariantData } from '@/lib/chrysalisVariants';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { Palette, RefreshCw, Shell, CheckCircle } from 'lucide-react';
import { useState } from 'react';

interface CoinDetailActivationModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  coinVariant: ChrysalisVariantData | null;
}

export default function CoinDetailActivationModal({ isOpen, onOpenChange, coinVariant }: CoinDetailActivationModalProps) {
  const { activateThemeFromCollectedCoin, userProfile } = useAuth();
  const [isActivating, setIsActivating] = useState(false);

  if (!coinVariant) return null;

  const CoinIcon = coinVariant.icon || Shell;
  const isCurrentlyActive = userProfile?.activeChrysalisThemeId === coinVariant.id && userProfile?.photoURL?.includes('chrysalis');

  const handleActivate = async () => {
    if (!coinVariant) return;
    setIsActivating(true);
    await activateThemeFromCollectedCoin(coinVariant);
    setIsActivating(false);
    onOpenChange(false);
  };

  const dynamicHeaderStyle: React.CSSProperties = {
    background: `linear-gradient(to bottom right, hsl(${coinVariant.themePrimaryHSL}), hsl(${coinVariant.themeAccentHSL}))`,
  };

  const dynamicIconStyle: React.CSSProperties = {
    color: `hsl(${coinVariant.themePrimaryHSL})`,
  };
  
  const dynamicTitleStyle: React.CSSProperties = {
    color: `hsl(${coinVariant.themePrimaryForegroundHSL})`,
  };

  const dynamicActivateButtonStyle: React.CSSProperties = {
    backgroundColor: `hsl(${coinVariant.themePrimaryHSL})`,
    color: `hsl(${coinVariant.themePrimaryForegroundHSL})`,
    borderColor: `hsl(${coinVariant.themePrimaryHSL})` // For consistency if it has a border
  };
  const dynamicActivateButtonHoverStyle: React.CSSProperties = {
     // Slightly darken or adjust the primary HSL for hover, ensuring L (lightness) is reduced
    backgroundColor: `hsl(${coinVariant.themePrimaryHSL.split(' ')[0]} ${coinVariant.themePrimaryHSL.split(' ')[1]} ${Math.max(0, parseFloat(coinVariant.themePrimaryHSL.split(' ')[2]) - 10)}%)`,
  };


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden shadow-2xl rounded-lg">
        <DialogHeader 
            className="p-6 pb-4 text-center items-center justify-center rounded-t-lg"
            style={dynamicHeaderStyle}
        >
          <CoinIcon className={cn("!h-20 !w-20 mb-3")} style={dynamicTitleStyle} data-ai-hint={coinVariant.name.toLowerCase().includes("shell") ? "chrysalis shell" : "icon nature"}/>
          <DialogTitle className="font-headline text-3xl" style={dynamicTitleStyle}>
            {coinVariant.name}
          </DialogTitle>
        </DialogHeader>
        <div className="pt-4 pb-6 px-6 space-y-4 text-center">
          <DialogDescription className="text-muted-foreground text-base">
            {coinVariant.description}
          </DialogDescription>
          <div className="p-3 bg-muted/30 rounded-md border">
            <p className="text-sm font-semibold text-foreground">Challenge Day:</p>
            <p className="text-sm text-muted-foreground">{coinVariant.dayNumber}</p>
          </div>
        </div>
        <DialogFooter className="px-6 py-4 bg-muted/20 border-t rounded-b-lg flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button onClick={() => onOpenChange(false)} variant="outline" className="order-2 sm:order-1 w-full sm:w-auto">Close</Button>
          {isCurrentlyActive ? (
            <div className="flex items-center text-sm font-semibold order-1 sm:order-2" style={{color: `hsl(${coinVariant.themePrimaryHSL})`}}>
              <CheckCircle className="mr-2 h-5 w-5" />
              Theme is Active
            </div>
          ) : (
            <Button 
              onClick={handleActivate} 
              disabled={isActivating} 
              className="order-1 sm:order-2 w-full sm:w-auto transition-colors duration-150 ease-in-out"
              style={isActivating ? {} : dynamicActivateButtonStyle}
              onMouseEnter={e => {
                if(!isActivating) Object.assign(e.currentTarget.style, dynamicActivateButtonHoverStyle);
              }}
              onMouseLeave={e => {
                 if(!isActivating) Object.assign(e.currentTarget.style, dynamicActivateButtonStyle);
              }}
            >
              {isActivating ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Palette className="mr-2 h-4 w-4" />}
              Activate Theme
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

