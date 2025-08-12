'use client';

import { Wand2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Skeleton } from './ui/skeleton';

interface AiAnalysisCardProps {
  analysis: string;
  isLoading: boolean;
}

export default function AiAnalysisCard({ analysis, isLoading }: AiAnalysisCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2">
        <Wand2 className="h-6 w-6 text-primary" />
        <div>
          <CardTitle>AI Analysis</CardTitle>
          <CardDescription>Generated from chart patterns.</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
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
