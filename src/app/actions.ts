
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

const stockIntervalMap = {
  M5: { apiFunction: 'TIME_SERIES_INTRADAY', apiInterval: '5min', dataKey: 'Time Series (5min)' },
  M30: { apiFunction: 'TIME_SERIES_INTRADAY', apiInterval: '30min', dataKey: 'Time Series (30min)' },
  H1: { apiFunction: 'TIME_SERIES_INTRADAY', apiInterval: '60min', dataKey: 'Time Series (60min)' },
  D1: { apiFunction: 'TIME_SERIES_DAILY', apiInterval:'1day',dataKey: 'Time Series (Daily)' },
};

const forexIntervalMap = {
  M5: { apiFunction: 'FX_INTRADAY', apiInterval: '5min', dataKey: 'Time Series FX (5min)' },
  M30: { apiFunction: 'FX_INTRADAY', apiInterval: '30min', dataKey: 'Time Series FX (30min)' },
  H1: { apiFunction: 'FX_INTRADAY', apiInterval: '60min', dataKey: 'Time Series FX (60min)' },
  D1: { apiFunction: 'FX_DAILY', apiInterval:'1day',dataKey: 'Time Series FX (Daily)' },
};

const commodityIntervalMap: { [key: string]: 'daily' | 'weekly' | 'monthly' } = {
    D1: 'daily',
    M5: 'daily',
    M30: 'daily',
    H1: 'daily',
};

export async function getStockDataAndAnalysis({ symbol, interval, type, fromCurrency, toCurrency }: ActionParams) {
  const apiKey = process.env.ALPHAVANTAGE_API_KEY || '7QVSC2272SOG1WSN';
  if (!apiKey) {
    return { error: 'AlphaVantage API key is not configured.' };
  }

  let url: string;
  let dataKey: string | null = null;
  let analysisSymbol: string;
  let isCommodity = type === 'commodities';

  try {
    if (type === 'stock') {
      if (!symbol) return { error: "Stock symbol is required." };
      const stockMap = stockIntervalMap[interval];
      url = `https://www.alphavantage.co/query?function=${stockMap.apiFunction}&symbol=${symbol}&apikey=${apiKey}`;
      if (stockMap.apiInterval && stockMap.apiFunction.includes('INTRADAY')) {
        url += `&interval=${stockMap.apiInterval}`;
      }
      dataKey = stockMap.dataKey;
      analysisSymbol = symbol;
    } else if (type === 'forex') {
      if (!fromCurrency || !toCurrency) return { error: "From and To currencies are required for forex." };
      analysisSymbol = `${fromCurrency}/${toCurrency}`;
      const forexMap = forexIntervalMap[interval];
      url = `https://www.alphavantage.co/query?function=${forexMap.apiFunction}&from_symbol=${fromCurrency}&to_symbol=${toCurrency}&apikey=${apiKey}`;
      if (forexMap.apiInterval && forexMap.apiFunction.includes('INTRADAY')) {
        url += `&interval=${forexMap.apiInterval}`;
      }
      dataKey = forexMap.dataKey;
    } else { // commodities
      if (!symbol) return { error: "Commodity symbol is required." };
      const apiFunction = symbol; // e.g. WTI, BRENT
      const apiInterval = commodityIntervalMap[interval] || 'daily';
      url = `https://www.alphavantage.co/query?function=${apiFunction}&interval=${apiInterval}&apikey=${apiKey}`;
      dataKey = 'data'; 
      analysisSymbol = symbol;
    }

    const response = await fetch(url);
    if (!response.ok) {
        const errorText = await response.text();
        console.error("AlphaVantage API non-OK response:", errorText);
        return { error: `API request failed with status ${response.status}. Please check symbol and API key.` };
    }
    const rawData = await response.json();

    if (!rawData || typeof rawData !== 'object') {
        return { error: 'Received invalid data format from AlphaVantage API.' };
    }

    if (rawData['Error Message']) {
      return { error: `API Error: ${rawData['Error Message']}` };
    }
    
    if (rawData['Note']) {
       return { error: `API Limit Reached: ${rawData['Note']}. Please wait and try again.` };
    }

    const timeSeries = rawData[dataKey!];
    
    if (!timeSeries) {
        const possibleKeys = Object.keys(rawData);
        const errorMessage = isCommodity 
            ? `Could not find data for commodity '${analysisSymbol}'. It may not be supported or the API limit was reached.`
            : `Could not find time series data for '${analysisSymbol}'. The symbol might be invalid or the API limit was reached. Available keys: ${possibleKeys.join(', ')}`;
        return { error: errorMessage };
    }
    
    let formattedData: StockData[];

    if (isCommodity) {
        if (!Array.isArray(timeSeries)) {
             return { error: `Unexpected data format for commodity '${analysisSymbol}'. Expected an array.` };
        }
        formattedData = (timeSeries as any[])
            .map((item: any) => {
                if (item.date && item.value && item.value !== '.') {
                    const val = parseFloat(item.value);
                    if (!isNaN(val)) {
                        return {
                            date: new Date(item.date).toISOString(),
                            open: val,
                            high: val,
                            low: val,
                            close: val,
                        };
                    }
                }
                return null;
            })
            .filter((item): item is StockData => item !== null)
            .reverse();
    } else {
        if (typeof timeSeries !== 'object' || timeSeries === null) {
            return { error: `Unexpected data format for ${analysisSymbol}. Expected an object of time series.` };
        }
        formattedData = Object.entries(timeSeries)
          .map(([time, values]: [string, any]) => {
            const open = parseFloat(values['1. open']);
            const high = parseFloat(values['2. high']);
            const low = parseFloat(values['3. low']);
            const close = parseFloat(values['4. close']);

            if (!isNaN(open) && !isNaN(high) && !isNaN(low) && !isNaN(close)) {
                return {
                    date: new Date(time).toISOString(),
                    open,
                    high,
                    low,
                    close,
                };
            }
            return null;
          })
          .filter((item): item is StockData => item !== null)
          .reverse();
    }

    if (formattedData.length === 0) {
      return { error: 'No data points were found for this symbol/currency. It might be an invalid symbol or no data is available for the selected interval.' };
    }

    const analysisResult = await analyzeCandlestickPattern({
      graphData: JSON.stringify(formattedData.slice(-50)), // Send last 50 points for analysis
      interval,
      symbol: analysisSymbol,
    });
    
    return { data: formattedData, analysis: analysisResult.analysis };
  } catch (error: any) {
    console.error("Error in getStockDataAndAnalysis:", error);
    return { error: error.message || 'An unknown error occurred while fetching data.' };
  }
}
