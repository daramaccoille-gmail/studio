'use server';
/**
 * @fileOverview Provides textual analysis of candlestick patterns in a graph.
 *
 * - analyzeCandlestickPattern - A function to analyze candlestick patterns.
 * - AnalyzeCandlestickPatternInput - The input type for the analyzeCandlestickPattern function.
 * - AnalyzeCandlestickPatternOutput - The return type for the analyzeCandlestickPattern function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeCandlestickPatternInputSchema = z.object({
  graphData: z
    .string()
    .describe(
      'Candlestick graph data, likely in JSON or CSV format. Include the timestamp and OHLC (Open, High, Low, Close) values.'
    ),
  interval: z
    .string()
    .describe(
      'The time interval for the candlestick graph, e.g., M5, M30, H1, D1.'
    ),
  symbol: z.string().describe('The stock symbol for the candlestick graph.'),
});

export type AnalyzeCandlestickPatternInput = z.infer<
  typeof AnalyzeCandlestickPatternInputSchema
>;

const AnalyzeCandlestickPatternOutputSchema = z.object({
  analysis: z
    .string()
    .describe(
      'A textual analysis of the candlestick graph, highlighting potential patterns and trends.'
    ),
});

export type AnalyzeCandlestickPatternOutput = z.infer<
  typeof AnalyzeCandlestickPatternOutputSchema
>;

export async function analyzeCandlestickPattern(
  input: AnalyzeCandlestickPatternInput
): Promise<AnalyzeCandlestickPatternOutput> {
  return analyzeCandlestickPatternFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeCandlestickPatternPrompt',
  input: {schema: AnalyzeCandlestickPatternInputSchema},
  output: {schema: AnalyzeCandlestickPatternOutputSchema},
  prompt: `You are a financial analyst specializing in candlestick pattern recognition.

  Analyze the provided candlestick graph data for the given stock symbol and time interval.
  Identify any notable candlestick patterns and trends, and provide a textual analysis of your findings.

  Stock Symbol: {{{symbol}}}
  Time Interval: {{{interval}}}
  Graph Data: {{{graphData}}}

  Provide a concise and informative analysis of the candlestick patterns and trends.
`,
});

const analyzeCandlestickPatternFlow = ai.defineFlow(
  {
    name: 'analyzeCandlestickPatternFlow',
    inputSchema: AnalyzeCandlestickPatternInputSchema,
    outputSchema: AnalyzeCandlestickPatternOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
