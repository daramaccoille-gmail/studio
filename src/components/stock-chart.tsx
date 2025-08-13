'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Rectangle,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Skeleton } from './ui/skeleton';
import type { StockData } from '@/lib/types';
import { format } from 'date-fns';

interface StockChartProps {
  data: StockData[];
  isLoading: boolean;
  symbol: string;
}

const Candlestick = (props: any) => {
  const { x, y, width, height, low, high, open, close } = props;
  const isBullish = close >= open;
  const fill = isBullish ? 'hsl(var(--chart-2))' : 'hsl(var(--destructive))';
  const stroke = fill;

  return (
    <g stroke={stroke} fill="none" strokeWidth="1">
      <path
        d={`M ${x + width / 2},${y} L ${x + width / 2},${y - (high - Math.max(open, close))}`}
      />
      <path
        d={`M ${x + width / 2},${y + height} L ${x + width / 2},${y + height + (Math.min(open, close) - low)}`}
      />
      <Rectangle
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill}
      />
    </g>
  );
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const ohlc = data.ohlc;
    return (
      <Card className="text-sm">
        <CardContent className="p-2">
          <p className="font-bold">{format(new Date(data.date), 'PPpp')}</p>
          <p>Open: {ohlc[0].toFixed(5)}</p>
          <p>High: {ohlc[1].toFixed(5)}</p>
          <p>Low: {ohlc[2].toFixed(5)}</p>
          <p>Close: {ohlc[3].toFixed(5)}</p>
        </CardContent>
      </Card>
    );
  }
  return null;
};

export default function StockChart({ data, isLoading, symbol }: StockChartProps) {
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
          <CardTitle>No Data Available</CardTitle>
          <CardDescription>
            Could not retrieve chart data. Please try a different symbol or check your API key.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full flex items-center justify-center bg-muted rounded-md">
            <p className="text-muted-foreground">No data to display.</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const chartData = data.map(d => ({
    date: d.date,
    ohlc: [d.open, d.high, d.low, d.close]
  }));

  const domain: [number, number] = [
    Math.min(...data.map(d => d.low)),
    Math.max(...data.map(d => d.high))
  ];

  const yAxisTickFormatter = (value: number) => {
    const isForex = symbol.includes('/');
    return isForex ? value.toFixed(5) : value.toFixed(2);
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
            <BarChart
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
              <Bar
                dataKey="ohlc"
                shape={<Candlestick />}
              >
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
