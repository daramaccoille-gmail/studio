'use client';

import { useState, useEffect, useTransition, FormEvent } from 'react';
import { CandlestickChart, Loader, Search, ArrowRightLeft } from 'lucide-react';
import { getStockDataAndAnalysis } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import StockChart from '@/components/stock-chart';
import AiAnalysisCard from '@/components/ai-analysis-card';
import type { StockData } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { CurrencyCombobox } from '@/components/currency-combobox';


type Interval = 'M5' | 'M30' | 'H1' | 'D1';
type DataType = 'stock' | 'forex';

export default function Home() {
  const [symbol, setSymbol] = useState('IBM');
  const [inputSymbol, setInputSymbol] = useState('IBM');
  const [interval, setInterval] = useState<Interval>('D1');
  const [data, setData] = useState<StockData[]>([]);
  const [analysis, setAnalysis] = useState<string>('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [dataType, setDataType] = useState<DataType>('stock');
  const [fromCurrency, setFromCurrency] = useState('EUR');
  const [toCurrency, setToCurrency] = useState('USD');
  const [displaySymbol, setDisplaySymbol] = useState('IBM');

  const handleFetchData = (params: {
      fetchInterval: Interval,
      fetchType: DataType,
      fetchSymbol?: string,
      fetchFromCurrency?: string,
      fetchToCurrency?: string
  }) => {
    startTransition(async () => {
      const { fetchInterval, fetchType, fetchSymbol, fetchFromCurrency, fetchToCurrency } = params;

      let result;
      if (fetchType === 'stock') {
          result = await getStockDataAndAnalysis({
          symbol: fetchSymbol,
          interval: fetchInterval,
          type: 'stock',
        });
        if (!result.error) {
            setDisplaySymbol(fetchSymbol!);
            setSymbol(fetchSymbol!);
        }
      } else {
        result = await getStockDataAndAnalysis({
          interval: fetchInterval,
          type: 'forex',
          fromCurrency: fetchFromCurrency,
          toCurrency: fetchToCurrency,
        });
        if (!result.error) {
            const forexSymbol = `${fetchFromCurrency}/${fetchToCurrency}`;
            setDisplaySymbol(forexSymbol);
            setFromCurrency(fetchFromCurrency!);
            setToCurrency(fetchToCurrency!);
        }
      }

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
      }
    });
  };

  useEffect(() => {
    handleFetchData({ fetchSymbol: symbol, fetchInterval: interval, fetchType: 'stock' });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (dataType === 'stock' && inputSymbol.trim()) {
      handleFetchData({ fetchSymbol: inputSymbol.trim().toUpperCase(), fetchInterval: interval, fetchType: 'stock' });
    } else if (dataType === 'forex' && fromCurrency && toCurrency) {
      handleFetchData({ fetchFromCurrency: fromCurrency, fetchToCurrency: toCurrency, fetchInterval: interval, fetchType: 'forex' });
    }
  };

  const handleIntervalChange = (value: string) => {
    const newInterval = value as Interval;
    setInterval(newInterval);
     if (dataType === 'stock') {
      handleFetchData({ fetchSymbol: symbol, fetchInterval: newInterval, fetchType: 'stock' });
    } else {
      handleFetchData({ fetchFromCurrency: fromCurrency, fetchToCurrency: toCurrency, fetchInterval: newInterval, fetchType: 'forex' });
    }
  };

  const handleDataTypeChange = (value: string) => {
    const newType = value as DataType;
    setDataType(newType);
    setData([]);
    setAnalysis('');
    setDisplaySymbol(newType === 'stock' ? symbol : `${fromCurrency}/${toCurrency}`);
    if (newType === 'forex' && fromCurrency && toCurrency) {
        handleFetchData({ fetchInterval: interval, fetchType: 'forex', fetchFromCurrency: fromCurrency, fetchToCurrency: toCurrency });
    } else if (newType === 'stock' && symbol) {
        handleFetchData({ fetchInterval: interval, fetchType: 'stock', fetchSymbol: symbol });
    }
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
                <div className="space-y-2">
                    <h2 className="text-lg font-semibold">Data Type</h2>
                    <Tabs value={dataType} onValueChange={handleDataTypeChange} className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="stock">Stocks</TabsTrigger>
                            <TabsTrigger value="forex">Forex</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  {dataType === 'stock' ? (
                     <div className="space-y-2">
                      <Label htmlFor="stock-symbol" className="text-lg font-semibold">Stock Symbol</Label>
                      <div className="flex w-full items-center space-x-2">
                        <Input
                          id="stock-symbol"
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
                  ) : (
                    <div className="space-y-4">
                        <div className="space-y-2">
                           <Label htmlFor="from-currency" className="text-lg font-semibold">From Currency</Label>
                           <CurrencyCombobox
                              value={fromCurrency}
                              onChange={setFromCurrency}
                              placeholder="From"
                            />
                        </div>
                         <div className="flex justify-center">
                            <ArrowRightLeft className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="space-y-2">
                             <Label htmlFor="to-currency" className="text-lg font-semibold">To Currency</Label>
                            <CurrencyCombobox
                              value={toCurrency}
                              onChange={setToCurrency}
                              placeholder="To"
                            />
                        </div>
                        <Button type="submit" disabled={isPending} className="w-full">
                          {isPending ? <Loader className="animate-spin" /> : 'Get Forex Data'}
                        </Button>
                    </div>
                  )}
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
              <StockChart data={data} isLoading={isPending} symbol={displaySymbol} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
