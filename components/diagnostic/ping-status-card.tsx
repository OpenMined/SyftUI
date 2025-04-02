"use client"

import { useState, useEffect } from "react"
import { Server, RefreshCw } from "lucide-react"
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip
} from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import {
  ChartConfig,
  ChartContainer
} from "@/components/ui/chart"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface PingStatusCardProps {
  serverName?: string
  serverAddress?: string
  className?: string
}

export function PingStatusCard({
  serverName = "cache server",
  serverAddress = "https://syftbox.openmined.org/",
  className = ""
}: PingStatusCardProps) {
  // Maximum number of data points to store (15 seconds with 1 second resolution)
  const MAX_DATA_POINTS = 15

  // Create initial data with proper fixed time labels (inverted: "now" on left, oldest on right)
  const initialData = Array.from({ length: MAX_DATA_POINTS }, (_, i) => {
    return {
      // Use fixed time labels: "now", "1s", "2s", ..., "119s"
      time: i === 0 ? "now" : `${i + 1}s`,
      ping: null
    };
  });

  const [dataCount, setDataCount] = useState<number>(0)
  const [pingHistory, setPingHistory] = useState<{ time: string; ping: number | null }[]>(initialData)
  const [connectionStatus, setConnectionStatus] = useState<string>("Connecting...")
  const [statusColor, setStatusColor] = useState<string>("text-yellow-500")
  const [isInitialized, setIsInitialized] = useState<boolean>(false)
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)

  const chartConfig = {
    ping: {
      label: "Ping",
      color: "hsl(var(--primary))",
    },
  } satisfies ChartConfig

  // Generate a random ping value with occasional spikes up to 300ms
  const generateRandomPing = () => {
    const random = Math.random()
    // More variety in latency with three different ranges
    if (random > 0.95) {
      // High spike (150-300ms) - 5% chance
      return Math.round(Math.random() * 150 + 150)
    } else if (random > 0.85) {
      // Medium spike (50-150ms) - 10% chance
      return Math.round(Math.random() * 100 + 50)
    } else {
      // Normal range (5-50ms) - 85% chance
      return Math.round(Math.random() * 45 + 5)
    }
  }

  // Function to restart the ping test
  const handleRefresh = () => {
    // Reset states
    setDataCount(0)
    setPingHistory(initialData)
    setConnectionStatus("Connecting...")
    setStatusColor("text-yellow-500")

    // Show refresh animation
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 750) // Animation duration
  }

  // Simulate ping test
  useEffect(() => {
    setIsInitialized(true)

    const interval = setInterval(() => {
      // Generate new ping value
      const newPing = generateRandomPing()

      // Update connection status based on ping time
      if (newPing < 20) {
        setConnectionStatus("Excellent")
        setStatusColor("text-green-500")
      } else if (newPing < 50) {
        setConnectionStatus("Good")
        setStatusColor("text-green-400")
      } else if (newPing < 100) {
        setConnectionStatus("Fair")
        setStatusColor("text-yellow-500")
      } else {
        setConnectionStatus("Poor")
        setStatusColor("text-red-500")
      }

      // Update ping history by adding a new value at the current position
      setPingHistory(prevHistory => {
        const newHistory = [...prevHistory];

        // If we haven't filled the array yet, add the new ping at the current position
        if (dataCount < MAX_DATA_POINTS) {
          // This creates the effect of the line growing from left to right
          // IMPORTANT: We only update the ping value, not the time label
          newHistory[dataCount].ping = newPing;
        } else {
          // Once we've filled the array, shift all ping values to the right
          for (let i = MAX_DATA_POINTS - 1; i > 0; i--) {
            newHistory[i].ping = newHistory[i - 1].ping;
          }
          newHistory[0].ping = newPing; // Add the newest point
        }

        return newHistory;
      });

      // Increment data count until we reach MAX_DATA_POINTS
      setDataCount(prev => Math.min(prev + 1, MAX_DATA_POINTS))
    }, 1000) // 1 second resolution

    // Clear interval after all data points are filled
    if (dataCount >= MAX_DATA_POINTS) {
      clearInterval(interval)
    }

    return () => clearInterval(interval)
  }, [dataCount])

  // Calculate stats for reference line, only using actual data points
  const validPings = pingHistory
    .filter(item => item.ping !== null)
    .map(item => item.ping as number)

  const avgPing = validPings.length > 0
    ? validPings.reduce((sum, ping) => sum + ping, 0) / validPings.length
    : 0

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length && payload[0].value !== null) {
      return (
        <div className="bg-background border border-border/50 rounded-lg p-2 shadow-md text-xs">
          <p className="font-medium">{`${payload[0].value} ms`}</p>
          <p className="text-muted-foreground">{payload[0].payload.time}</p>
        </div>
      );
    }
    return null;
  };

  // Format X-axis tick to show more time markers since we only have 15 seconds
  const formatXAxisTick = (value: string) => {
    if (value === "now") return value;
    const secondsMatch = value.match(/^(\d+)s$/);
    if (!secondsMatch) return '';

    const seconds = parseInt(secondsMatch[1]);
    if (seconds % 5 === 0 || seconds === 1) {
      return seconds + 's';
    }
    return '';
  };

  // Dynamically set domain for Y axis
  const getYAxisDomain = () => {
    if (validPings.length === 0) return [0, 10];
    const maxPing = Math.max(...validPings);
    return [0, Math.max(50, maxPing * 1.2)]; // At least 0-50ms, otherwise 20% higher than max
  };

  const averagePing = validPings.length > 0
    ? validPings.reduce((sum, ping) => sum + ping, 0) / validPings.length
    : 0
  const averagePingRounded = Math.round(averagePing)

  return (
    <TooltipProvider>
      <Card className={`shadow-md ${className}`}>
        <CardHeader className="pb-2">
          <div className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl">
                {validPings.length === MAX_DATA_POINTS ? "Ping" : "Pinging"} {serverName}
              </CardTitle>
              <CardDescription>{serverAddress}</CardDescription>
            </div>
            <Tooltip>
              <TooltipTrigger>
                <div className="text-3xl font-bold">{averagePingRounded} ms</div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-sm">Average ping</div>
                <div className="text-sm">{validPings.length} samples</div>
              </TooltipContent>
            </Tooltip>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Server className={`mr-2 h-5 w-5 ${statusColor}`} />
              <span className={`font-medium ${statusColor}`}>{connectionStatus}</span>
            </div>
            <button
              onClick={handleRefresh}
              className="flex items-center justify-center p-1.5 rounded-full hover:bg-muted transition-colors"
              aria-label="Restart ping test"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <ChartContainer config={chartConfig} className="h-64 w-full">
            <LineChart
              data={pingHistory}
              margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 11 }}
                tickMargin={8}
                tickFormatter={formatXAxisTick}
                interval={0}
                domain={["dataMin", "dataMax"]}
                scale="point"
                padding={{ left: 0, right: 0 }}
              />
              <YAxis
                domain={getYAxisDomain()}
                tick={{ fontSize: 11 }}
                tickMargin={8}
                width={30}
              />
              {avgPing > 0 && (
                <ReferenceLine
                  y={avgPing}
                  stroke="hsl(var(--primary)/0.5)"
                  strokeDasharray="3 3"
                  label={{
                    value: "Avg",
                    fill: "hsl(var(--primary))",
                    fontSize: 11,
                    position: "insideBottomRight"
                  }}
                />
              )}
              <RechartsTooltip content={<CustomTooltip />} />
              <Line
                type="linear"
                dataKey="ping"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={true}
                activeDot={{ r: 6, strokeWidth: 2, fill: "hsl(var(--primary))" }}
                isAnimationActive={false}
                connectNulls={false}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
        <CardFooter className="flex-col items-start gap-2 text-sm">
          <div className="leading-none text-muted-foreground">
            Showing ping measurements over the last {MAX_DATA_POINTS} seconds
          </div>
        </CardFooter>
      </Card>
    </TooltipProvider>
  )
}