
'use client';

import {
  Line,
  ComposedChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Bar,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Skeleton } from './ui/skeleton';
import type { StockData } from '@/lib/types';
import { format } from 'date-fns';

type DataType = 'stock' | 'forex' | 'commodities';
interface StockChartProps {
  data: StockData[];
  isLoading: boolean;
  symbol: string;
  dataType: DataType;
  hasSearched: boolean;
}

const CustomCandlestick = (props: any) => {
  const { x, y, width, height, low, high, open, close, yAxis } = props;
  if (!yAxis) return null;

  const isBullish = close >= open;
  const fill = isBullish ? 'hsl(var(--chart-2))' : 'hsl(var(--destructive))';
  const stroke = fill;

  const yDomain = yAxis.scale.domain();
  const yRange = yAxis.scale.range();
  
  const getY = (value: number) => {
    return yRange[0] - ((value - yDomain[0]) / (yDomain[1] - yDomain[0])) * (yRange[0] - yRange[1]);
  }

  // The y-coordinates are inverted in recharts
  const bodyY = isBullish ? getY(close) : getY(open);
  const bodyHeight = Math.max(1, Math.abs(getY(close) - getY(open)));
  
  return (
    <g stroke={stroke} fill="none" strokeWidth="1">
      {/* Wick */}
      <path d={`M ${x + width / 2},${getY(high)} L ${x + width / 2},${getY(low)}`} />
      {/* Body */}
      <rect x={x} y={bodyY} width={width} height={bodyHeight} fill={fill} />
    </g>
  );
};


const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <Card className="text-sm">
        <CardContent className="p-2">
          <p className="font-bold">{format(new Date(data.date), 'PPpp')}</p>
          <p>Open: {data.open.toFixed(5)}</p>
          <p>High: {data.high.toFixed(5)}</p>
          <p>Low: {data.low.toFixed(5)}</p>
          <p>Close: {data.close.toFixed(5)}</p>
        </CardContent>
      </Card>
    );
  }
  return null;
};

export default function StockChart({ data, isLoading, symbol, dataType, hasSearched }: StockChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{hasSearched ? 'No Data Available' : 'Welcome to CandleView'}</CardTitle>
          <CardDescription>
            {hasSearched
              ? 'Could not retrieve chart data. Please try a different symbol or check your API key.'
              : 'Select a data type, enter a symbol, and click search to view financial data.'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full flex items-center justify-center bg-muted rounded-md">
            <p className="text-muted-foreground">
              {hasSearched ? 'No data to display.' : 'Your chart will appear here.'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const chartData = data;


  const domain: [number, number] = [
    Math.min(...data.map(d => d.low)),
    Math.max(...data.map(d => d.high))
  ];

  const yAxisTickFormatter = (value: number) => {    const isForex = symbol.includes('/');
    if (isForex || value < 10) {
       return value.toFixed(4);
    }
    return value.toFixed(2);
  }
  
  return (
    <Card>
 <CardHeader>
 <CardTitle>{symbol} Candlestick Chart</CardTitle>
        <CardDescription>
          Showing financial data for {symbol}. Hover over the chart for details.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
             <ComposedChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
             >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="date" 
                tickFormatter={(dateStr) => format(new Date(dateStr), 'MMM dd')}
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={domain}
                orientation="right"
                tickFormatter={yAxisTickFormatter}
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))' }} />
              {dataType === 'commodities' ? (
                <Line type="monotone" dataKey="close" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} />
              ) : (
                <Bar dataKey="date" shape={<CustomCandlestick />} />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
