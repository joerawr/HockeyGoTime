"use client";

/**
 * Cost Projection Component
 * Feature: 006-privacy-analytics-dashboard
 *
 * Displays monthly cost estimate with alert thresholds
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface CostProjectionProps {
  totalCost: number;
  projectedMonthlyCost: number;
  dailyAverage: number;
  inputTokens: number;
  outputTokens: number;
  mapsApiCost?: number;
  mapsApiCalls?: number;
}

export function CostProjection({
  totalCost,
  projectedMonthlyCost,
  dailyAverage,
  inputTokens,
  outputTokens,
  mapsApiCost = 0,
  mapsApiCalls = 0,
}: CostProjectionProps) {
  // Alert thresholds
  const warningThreshold = 5.0; // $5/month
  const criticalThreshold = 10.0; // $10/month

  const alertLevel =
    projectedMonthlyCost >= criticalThreshold
      ? "critical"
      : projectedMonthlyCost >= warningThreshold
        ? "warning"
        : "normal";

  const alertColors = {
    normal: "text-green-600 dark:text-green-400",
    warning: "text-yellow-600 dark:text-yellow-400",
    critical: "text-red-600 dark:text-red-400",
  };

  const alertMessages = {
    normal: "Cost is within expected range",
    warning: "Approaching cost threshold",
    critical: "Cost exceeds threshold - review usage",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cost Projection</CardTitle>
        <CardDescription>Estimated monthly API costs</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Projected Monthly Cost */}
          <div>
            <div className="text-sm text-muted-foreground">Projected Monthly</div>
            <div className={`text-3xl font-bold ${alertColors[alertLevel]}`}>
              ${projectedMonthlyCost.toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {alertMessages[alertLevel]}
            </div>
          </div>

          {/* Current Period Cost */}
          <div className="pt-4 border-t">
            <div className="text-sm text-muted-foreground">Current Period Total</div>
            <div className="text-xl font-semibold">
              ${totalCost.toFixed(4)}
            </div>
          </div>

          {/* Daily Average */}
          <div>
            <div className="text-sm text-muted-foreground">Daily Average</div>
            <div className="text-xl font-semibold">
              ${dailyAverage.toFixed(4)}
            </div>
          </div>

          {/* Token Breakdown */}
          <div className="pt-4 border-t space-y-2">
            <div className="text-sm font-medium">Token Usage</div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Input</div>
                <div className="font-medium">
                  {inputTokens.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Output</div>
                <div className="font-medium">
                  {outputTokens.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Maps API Breakdown (if applicable) */}
          {mapsApiCalls > 0 && (
            <div className="pt-4 border-t space-y-2">
              <div className="text-sm font-medium">Google Maps API</div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Calls</div>
                  <div className="font-medium">
                    {mapsApiCalls.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Cost</div>
                  <div className="font-medium">
                    ${mapsApiCost.toFixed(4)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pricing Info */}
          <div className="pt-4 border-t text-xs text-muted-foreground">
            <div>Gemini 2.5 Flash Preview pricing:</div>
            <div>• Input: $0.30 per 1M tokens</div>
            <div>• Output: $2.50 per 1M tokens</div>
            {mapsApiCalls > 0 && (
              <div className="mt-2">
                <div>Google Routes API pricing:</div>
                <div>• $0.005 per request</div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
