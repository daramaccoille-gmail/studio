'use server';

import { analyzeCandlestickPattern } from '@/ai/flows/analyze-candlestick-pattern';
import type { StockData } from '@/lib/types';

interface ActionParams {
  symbol?: string;
  interval: 'M5' | 'M30' | 'H1' | 'D1';
  type: 'stock' | 'forex' | 'commodities';
  fromCurrency?: string;
  toCurrency?: string;
}

interface IntervalMapping {
  [key: string]: {
    apiFunction: 'TIME_SERIES_INTRADAY' | 'TIME_SERIES_DAILY' | 'FX_INTRADAY' | 'FX_DAILY' | 'COMMODITIES';
    apiInterval?: '5min' | '30min' | '60min' | 'daily' | 'weekly' | 'monthly';
    dataKey: string;
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

const commodityIntervalMap = {
    M5: '5min',
    M30: '30min',
    H1: '60min',
    D1: 'daily',
    W1: 'weekly',
    M1: 'monthly'
};


export async function getStockDataAndAnalysis({ symbol, interval, type, fromCurrency, toCurrency }: ActionParams) {
  const apiKey = process.env.ALPHAVANTAGE_API_KEY;

  if (!apiKey) {
    return { error: 'AlphaVantage API key is not configured.' };
  }

  let url;
  let dataKey;
  let analysisSymbol;
  let isCommodity = type === 'commodities';

  if (type === 'stock') {
    if (!symbol) return { error: "Stock symbol is required." };
    const stockMap = stockIntervalMap[interval];
    url = `https://www.alphavantage.co/query?function=${stockMap.apiFunction}&symbol=${symbol}&apikey=${apiKey}`;
    if (stockMap.apiInterval) {
      url += `&interval=${stockMap.apiInterval}`;
    }
    dataKey = stockMap.dataKey;
    analysisSymbol = symbol;
  } else if (type === 'forex') {
    if (!fromCurrency || !toCurrency) return { error: "From and To currencies are required for forex." };
    analysisSymbol = `${fromCurrency}/${toCurrency}`;
    const forexMap = forexIntervalMap[interval];
    url = `https://www.alphavantage.co/query?function=${forexMap.apiFunction}&from_symbol=${fromCurrency}&to_symbol=${toCurrency}&apikey=${apiKey}`;
    if (forexMap.apiInterval) {
      url += `&interval=${forexMap.apiInterval}`;
    }
    dataKey = forexMap.dataKey;
  } else { // commodities
    if (!symbol) return { error: "Commodity symbol is required." };
    // For commodities, the function name is the commodity symbol itself.
    const apiFunction = symbol;
    const apiInterval = commodityIntervalMap[interval] || 'daily';
    url = `https://www.alphavantage.co/query?function=${apiFunction}&interval=${apiInterval}&apikey=${apiKey}`;
    dataKey = 'data';
    analysisSymbol = symbol;
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
      const errorMessage = isCommodity 
        ? `Could not find data for commodity ${analysisSymbol}. It may not be supported or the API limit was reached.`
        : 'Could not find time series data in the response. The symbol/currency may be invalid or the API limit reached.';
      throw new Error(errorMessage);
    }
    
    let formattedData: StockData[];

    if (isCommodity) {
        // The commodity API returns an array of objects with 'date', and 'value'
        formattedData = (rawData.data as any[])
            .map((item: any) => ({
                date: new Date(item.date).toISOString(),
                open: parseFloat(item.value),
                high: parseFloat(item.value),
                low: parseFloat(item.value),
                close: parseFloat(item.value),
            }))
            .reverse();
    } else {
        formattedData = Object.entries(timeSeries)
          .map(([time, values]: [string, any]) => ({
            date: new Date(time).toISOString(),
            open: parseFloat(values['1. open']),
            high: parseFloat(values['2. high']),
            low: parseFloat(values['3. low']),
            close: parseFloat(values['4. close']),
          }))
          .reverse();
    }


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
