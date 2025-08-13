'use client';

import {
  Line,
  LineChart,
  ComposedChart,
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
  const { x, y, width, height, low, high, open, close } = props.payload;
  const {yAxis} = props;

  if (!yAxis || !yAxis.domain) {
    return null; // Don't render if yAxis properties are not available
  }
  
  const isBullish = close >= open;
  const fill = isBullish ? 'hsl(var(--chart-2))' : 'hsl(var(--destructive))';
  const stroke = fill;

  const yDomain = yAxis.domain;
  const yRange = yAxis.range;
  const yRatio = (yRange[0] - yRange[1]) / (yDomain[1] - yDomain[0]);
  
  const yVal = (val: number) => yRange[1] + (yDomain[1] - val) * yRatio;

  const yOpen = yVal(open);
  const yClose = yVal(close);
  const yHigh = yVal(high);
  const yLow = yVal(low);

  const rectY = Math.min(yOpen, yClose);
  const rectHeight = Math.max(1, Math.abs(yOpen - yClose));

  return (
     <g stroke={stroke} fill="none" strokeWidth="1">
       {/* Wick */}
      <path
        d={`M ${x + width / 2},${yHigh} L ${x + width / 2},${yLow}`}
      />
       {/* Body */}
       <rect
         x={x}
         y={rectY}
         width={width}
         height={rectHeight}
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
  
  const chartData = data;
  const isCommodity = data.every(d => d.open === d.high && d.open === d.low && d.open === d.close);


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
        <CardTitle>{symbol} {isCommodity ? 'Chart' : 'Candlestick Chart'}</CardTitle>
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
                // interval="preserveStartEnd"
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
              
                {isCommodity ? (
                    <Line type="monotone" dataKey="close" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} />
                ) : (
                    <Line
                        type="linear"
                        dataKey="close"
                        strokeWidth={0}
                        shape={<Candlestick />}
                        isAnimationActive={false}
                     />
                )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
