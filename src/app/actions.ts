'use server';

import { analyzeCandlestickPattern } from '@/ai/flows/analyze-candlestick-pattern';
import type { StockData } from '@/lib/types';

interface ActionParams {
  symbol: string;
  interval: 'M5' | 'M30' | 'H1' | 'D1';
}

interface IntervalMapping {
  [key: string]: {
    apiFunction: 'TIME_SERIES_INTRADAY' | 'TIME_SERIES_DAILY';
    apiInterval?: '5min' | '30min' | '60min';
    dataKey: 'Time Series (5min)' | 'Time Series (30min)' | 'Time Series (60min)' | 'Time Series (Daily)';
  };
}

const intervalMap: IntervalMapping = {
  M5: { apiFunction: 'TIME_SERIES_INTRADAY', apiInterval: '5min', dataKey: 'Time Series (5min)' },
  M30: { apiFunction: 'TIME_SERIES_INTRADAY', apiInterval: '30min', dataKey: 'Time Series (30min)' },
  H1: { apiFunction: 'TIME_SERIES_INTRADAY', apiInterval: '60min', dataKey: 'Time Series (60min)' },
  D1: { apiFunction: 'TIME_SERIES_DAILY', dataKey: 'Time Series (Daily)' },
};

export async function getStockDataAndAnalysis({ symbol, interval }: ActionParams) {
  const apiKey = process.env.ALPHAVANTAGE_API_KEY;

  if (!apiKey) {
    return { error: 'AlphaVantage API key is not configured.' };
  }

  const { apiFunction, apiInterval, dataKey } = intervalMap[interval];
  
  //let url = `https://www.alphavantage.co/query?function=${apiFunction}&symbol=${symbol}&apikey=${apiKey}`;
  let url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=USD&to_currency=XAU&apikey=${apiKey}`;
  
  if (apiInterval) {
    url += `&interval=${apiInterval}`;
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
      throw new Error('Could not find time series data in the response. The symbol may be invalid or the API limit reached.');
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
      return { error: 'No data returned for this symbol and interval.' };
    }

    const analysisResult = await analyzeCandlestickPattern({
      graphData: JSON.stringify(formattedData.slice(-50)), // Send last 50 points for analysis
      interval,
      symbol,
    });
    
    return { data: formattedData, analysis: analysisResult.analysis };
  } catch (error: any) {
    return { error: error.message || 'An unknown error occurred.' };
  }
}
