'use client';

import { Lock, Unlock, Wand2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Skeleton } from './ui/skeleton';

interface AiAnalysisCardProps {
  analysis: string;
  isLoading: boolean;
  isPremium?: boolean;
  isUnlocked?: boolean;
  onUnlock?: () => void;
}

const CipherText = ({ text }: { text: string }) => {
    const cipher = text.replace(/[^\s]/g, '█');
    return <p className="text-sm text-muted-foreground font-mono select-none">{cipher}</p>;
};

export default function AiAnalysisCard({
  analysis,
  isLoading,
  isPremium = false,
  isUnlocked = false,
  onUnlock,
}: AiAnalysisCardProps) {
  const showPaywall = isPremium && !isUnlocked && analysis && !isLoading;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2">
        {showPaywall ? <Lock className="h-6 w-6 text-primary" /> : <Wand2 className="h-6 w-6 text-primary" />}
        <div>
          <CardTitle>AI Analysis</CardTitle>
          <CardDescription>
            {showPaywall ? 'Unlock premium insights.' : 'Generated from chart patterns.'}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : showPaywall ? (
          <div className="space-y-4">
             <div className="p-4 rounded-md bg-muted/50 border border-dashed">
                <CipherText text={analysis} />
             </div>
            <Button onClick={onUnlock} className="w-full">
                <Unlock className="mr-2 h-4 w-4" />
                Unlock with Stripe
            </Button>
          </div>
        ) : analysis ? (
          <p className="text-sm text-muted-foreground">{analysis}</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            No analysis available. Fetch data to generate insights.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
