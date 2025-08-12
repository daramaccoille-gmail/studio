'use server';

import { analyzeCandlestickPattern } from '@/ai/flows/analyze-candlestick-pattern';
import type { StockData } from '@/lib/types';

interface ActionParams {
  symbol?: string;
  interval: 'M5' | 'M30' | 'H1' | 'D1';
  type: 'stock' | 'forex';
  fromCurrency?: string;
  toCurrency?: string;
}

interface IntervalMapping {
  [key: string]: {
    apiFunction: 'TIME_SERIES_INTRADAY' | 'TIME_SERIES_DAILY' | 'FX_INTRADAY' | 'FX_DAILY';
    apiInterval?: '5min' | '30min' | '60min';
    dataKey: 'Time Series (5min)' | 'Time Series (30min)' | 'Time Series (60min)' | 'Time Series (Daily)' | 'Time Series FX (5min)' | 'Time Series FX (30min)' | 'Time Series FX (60min)' | 'Time Series FX (Daily)';
  };
}

const stockIntervalMap: IntervalMapping = {
  M5: { apiFunction: 'TIME_SERIES_INTRADAY', apiInterval: '5min', dataKey: 'Time Series (5min)' },
  M30: { apiFunction: 'TIME_SERIES_INTRADAY', apiInterval: '30min', dataKey: 'Time Series (30min)' },
  H1: { apiFunction: 'TIME_SERIES_INTRADAY', apiInterval: '60min', dataKey: 'Time Series (60min)' },
  D1: { apiFunction: 'TIME_SERIES_DAILY', dataKey: 'Time Series (Daily)' },
};

const forexIntervalMap: IntervalMapping = {
  M5: { apiFunction: 'FX_INTRADAY', apiInterval: '5min', dataKey: 'Time Series FX (5min)' },
  M30: { apiFunction: 'FX_INTRADAY', apiInterval: '30min', dataKey: 'Time Series FX (30min)' },
  H1: { apiFunction: 'FX_INTRADAY', apiInterval: '60min', dataKey: 'Time Series FX (60min)' },
  D1: { apiFunction: 'FX_DAILY', dataKey: 'Time Series FX (Daily)' },
};


export async function getStockDataAndAnalysis({ symbol, interval, type, fromCurrency, toCurrency }: ActionParams) {
  const apiKey = process.env.ALPHAVANTAGE_API_KEY;

  if (!apiKey) {
    return { error: 'AlphaVantage API key is not configured.' };
  }

  let url;
  let dataKey;
  let analysisSymbol;

  if (type === 'stock') {
    if (!symbol) return { error: "Stock symbol is required." };
    const stockMap = stockIntervalMap[interval];
    url = `https://www.alphavantage.co/query?function=${stockMap.apiFunction}&symbol=${symbol}&apikey=${apiKey}`;
    if (stockMap.apiInterval) {
      url += `&interval=${stockMap.apiInterval}`;
    }
    dataKey = stockMap.dataKey;
    analysisSymbol = symbol;
  } else { // forex
    if (!fromCurrency || !toCurrency) return { error: "From and To currencies are required for forex." };
    const forexMap = forexIntervalMap[interval];
    url = `https://www.alphavantage.co/query?function=${forexMap.apiFunction}&from_symbol=${fromCurrency}&to_symbol=${toCurrency}&apikey=${apiKey}`;
    if (forexMap.apiInterval) {
      url += `&interval=${forexMap.apiInterval}`;
    }
    dataKey = forexMap.dataKey;
    analysisSymbol = `${fromCurrency}/${toCurrency}`;
  }


  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    const rawData = await response.json();

    if (rawData['Error Message']) {
      throw new Error(`API Error: ${rawData['Error Message']}`);
    }
    if (rawData['Note']) {
       return { error: `API Limit Note: ${rawData['Note']}` };
    }

    const timeSeries = rawData[dataKey];
    if (!timeSeries) {
      throw new Error('Could not find time series data in the response. The symbol/currency may be invalid or the API limit reached.');
    }

    const formattedData: StockData[] = Object.entries(timeSeries)
      .map(([time, values]: [string, any]) => ({
        date: time,
        open: parseFloat(values['1. open']),
        high: parseFloat(values['2. high']),
        low: parseFloat(values['3. low']),
        close: parseFloat(values['4. close']),
      }))
      .reverse();

    if (formattedData.length === 0) {
      return { error: 'No data returned for this symbol/currency and interval.' };
    }

    const analysisResult = await analyzeCandlestickPattern({
      graphData: JSON.stringify(formattedData.slice(-50)), // Send last 50 points for analysis
      interval,
      symbol: analysisSymbol,
    });
    
    return { data: formattedData, analysis: analysisResult.analysis };
  } catch (error: any) {
    return { error: error.message || 'An unknown error occurred.' };
  }
}
