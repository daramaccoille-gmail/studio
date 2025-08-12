'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
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

const CustomCandlestick = (props: any) => {
  const { x, y, width, height, payload } = props;
  const { open, close, high, low } = payload;
  
  const isBullish = close >= open;
  const fill = isBullish ? 'hsl(var(--chart-2))' : 'hsl(var(--destructive))';

  return (
    <g>
      <line x1={x + width / 2} y1={y} x2={x + width / 2} y2={y + height} stroke={fill} />
      <rect
        x={x}
        y={isBullish ? y + (open-close) : y}
        width={width}
        height={Math.max(1, Math.abs(open - close))}
        fill={fill}
      />
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
          <p>Open: {data.open.toFixed(2)}</p>
          <p>High: {data.high.toFixed(2)}</p>
          <p>Low: {data.low.toFixed(2)}</p>
          <p>Close: {data.close.toFixed(2)}</p>
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
  
  const domain: [number, number] = [
    Math.min(...data.map(d => d.low)),
    Math.max(...data.map(d => d.high))
  ];
  
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
              data={data}
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
                tickFormatter={(value) => value.toFixed(2)}
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))' }} />
              <Bar
                dataKey="close"
                shape={<CustomCandlestick />}
              >
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
