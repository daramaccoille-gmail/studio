'use client';

import { useState, useEffect, useTransition, FormEvent } from 'react';
import { CandlestickChart, Loader, Search } from 'lucide-react';
import { getStockDataAndAnalysis } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import StockChart from '@/components/stock-chart';
import AiAnalysisCard from '@/components/ai-analysis-card';
import type { StockData } from '@/lib/types';
import Logo from '@/components/logo';

type Interval = 'M5' | 'M30' | 'H1' | 'D1';

export default function Home() {
  const [symbol, setSymbol] = useState('IBM');
  const [inputSymbol, setInputSymbol] = useState('IBM');
  const [interval, setInterval] = useState<Interval>('D1');
  const [data, setData] = useState<StockData[]>([]);
  const [analysis, setAnalysis] = useState<string>('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleFetchData = (fetchSymbol: string, fetchInterval: Interval) => {
    startTransition(async () => {
      const result = await getStockDataAndAnalysis({
        symbol: fetchSymbol,
        interval: fetchInterval,
      });

      if (result.error) {
        toast({
          variant: 'destructive',
          title: 'Error fetching data',
          description: result.error,
        });
        setData([]);
        setAnalysis('');
      } else {
        setData(result.data || []);
        setAnalysis(result.analysis || '');
        setSymbol(fetchSymbol);
      }
    });
  };

  useEffect(() => {
    handleFetchData(symbol, interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (inputSymbol.trim()) {
      handleFetchData(inputSymbol.trim().toUpperCase(), interval);
    }
  };

  const handleIntervalChange = (value: string) => {
    const newInterval = value as Interval;
    setInterval(newInterval);
    handleFetchData(symbol, newInterval);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex items-center">
            <CandlestickChart className="h-6 w-6 mr-2 text-primary" />
            <h1 className="text-xl font-bold tracking-tight text-primary">CandleView</h1>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="container py-8">
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-3">
              <div className="space-y-6 sticky top-20">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <h2 className="text-lg font-semibold">Stock Symbol</h2>
                    <div className="flex w-full items-center space-x-2">
                      <Input
                        type="text"
                        placeholder="e.g. AAPL"
                        value={inputSymbol}
                        onChange={(e) => setInputSymbol(e.target.value)}
                        className="bg-card"
                      />
                      <Button type="submit" disabled={isPending}>
                        {isPending ? <Loader className="animate-spin" /> : <Search />}
                      </Button>
                    </div>
                  </div>
                </form>

                <div className="space-y-2">
                  <h2 className="text-lg font-semibold">Interval</h2>
                  <Tabs value={interval} onValueChange={handleIntervalChange} className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="M5" disabled={isPending}>5M</TabsTrigger>
                      <TabsTrigger value="M30" disabled={isPending}>30M</TabsTrigger>
                      <TabsTrigger value="H1" disabled={isPending}>1H</TabsTrigger>
                      <TabsTrigger value="D1" disabled={isPending}>1D</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                
                <AiAnalysisCard analysis={analysis} isLoading={isPending} />
              </div>
            </div>

            <div className="lg:col-span-9">
              <StockChart data={data} isLoading={isPending} symbol={symbol} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
