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
  const { x, y, width, height, payload, open, close } = props;
  
  const isBullish = payload.close >= payload.open;
  const fill = isBullish ? 'hsl(var(--chart-2))' : 'hsl(var(--destructive))';
  
  const high = payload.high;
  const low = payload.low;

  const yRender = isBullish ? y + (payload.open - payload.close) : y;
  const heightRender = Math.max(1, Math.abs(payload.open - payload.close));

  const yDomain = props.yAxis.domain;
  const yRange = props.yAxis.range;
  const yRatio = (yRange[0] - yRange[1]) / (yDomain[1] - yDomain[0]);
  
  const highCoord = yRange[0] - (high - yDomain[0]) * yRatio;
  const lowCoord = yRange[0] - (low - yDomain[0]) * yRatio;

  return (
    <g>
      <line x1={x + width / 2} y1={highCoord} x2={x + width / 2} y2={lowCoord} stroke={fill} />
      <rect
        x={x}
        y={yRender}
        width={width}
        height={heightRender}
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
                tickFormatter={yAxisTickFormatter}
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
