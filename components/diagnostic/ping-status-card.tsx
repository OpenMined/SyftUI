"use client"

import { useState, useEffect } from "react"
import { Server } from "lucide-react"
import { 
  CartesianGrid, 
  Line, 
  LineChart, 
  ReferenceLine, 
  XAxis, 
  YAxis,
  Tooltip
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
  // Maximum number of data points to store (2 minutes with 1 second resolution)
  const MAX_DATA_POINTS = 120

  const [pingTime, setPingTime] = useState<number>(0)
  const [pingHistory, setPingHistory] = useState<{ time: string; ping: number }[]>([])
  const [connectionStatus, setConnectionStatus] = useState<string>("Connecting...")
  const [statusColor, setStatusColor] = useState<string>("text-yellow-500")
  const [isInitialized, setIsInitialized] = useState<boolean>(false)
  
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
  
  // Simulate ping test
  useEffect(() => {
    // Initialize with empty data array
    setPingHistory([])
    setIsInitialized(true)
    
    const interval = setInterval(() => {
      // Generate new ping value
      const newPing = generateRandomPing()
      setPingTime(newPing)
      
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
      
      // Update ping history
      setPingHistory(prevHistory => {
        let newHistory = [...prevHistory, { time: "now", ping: newPing }]
        
        // Cap the history at MAX_DATA_POINTS
        if (newHistory.length > MAX_DATA_POINTS) {
          newHistory = newHistory.slice(newHistory.length - MAX_DATA_POINTS)
        }
        
        // Update time labels for all data points
        return newHistory.map((item, index) => {
          if (index === newHistory.length - 1) return { ...item, time: "now" }
          return { ...item, time: `${newHistory.length - 1 - index}s ago` }
        })
      })
    }, 1000) // 1 second resolution
    
    return () => clearInterval(interval)
  }, [])
  
  // Calculate stats for reference line, avoiding division by zero
  const avgPing = pingHistory.length > 0 
    ? pingHistory.reduce((sum, item) => sum + item.ping, 0) / pingHistory.length 
    : 0
  
  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border/50 rounded-lg p-2 shadow-md text-xs">
          <p className="font-medium">{`${payload[0].value} ms`}</p>
          <p className="text-muted-foreground">{payload[0].payload.time}</p>
        </div>
      );
    }
    return null;
  };

  // Format X-axis tick to show time markers (15s, 30s, 45s, 60s, etc.)
  const formatXAxisTick = (value: string) => {
    if (value === "now") return value;
    const secondsAgo = parseInt(value.split('s')[0]);
    if (secondsAgo % 15 === 0) {
      return secondsAgo + 's';
    }
    return '';
  };
  
  // Create placeholder array with empty values for chart initialization
  const placeholderData = Array.from({ length: MAX_DATA_POINTS }, (_, i) => ({
    time: `${MAX_DATA_POINTS - i}s ago`,
    ping: 0
  }));
  
  // Dynamically set domain for Y axis
  const getYAxisDomain = () => {
    if (pingHistory.length === 0) return [0, 10];
    const maxPing = Math.max(...pingHistory.map(item => item.ping));
    return [0, Math.max(50, maxPing * 1.2)]; // At least 0-50ms, otherwise 20% higher than max
  };
  
  return (
    <Card className={`shadow-md ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl">Pinging {serverName}</CardTitle>
            <CardDescription>{serverAddress}</CardDescription>
          </div>
          <div className="text-3xl font-bold">{pingTime} ms</div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center mb-4">
          <Server className={`mr-2 h-5 w-5 ${statusColor}`} />
          <span className={`font-medium ${statusColor}`}>{connectionStatus}</span>
        </div>
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <LineChart
            data={pingHistory.length > 0 ? pingHistory : placeholderData}
            margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
            <XAxis 
              dataKey="time" 
              tick={{ fontSize: 11 }}
              tickMargin={8}
              tickFormatter={formatXAxisTick}
              interval={0}
              domain={['auto', 'auto']}
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
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="natural"
              dataKey="ping"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6, strokeWidth: 2, fill: "white" }}
              animationDuration={300}
              isAnimationActive={true}
              // Only show actual data, not placeholders
              data={pingHistory}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="leading-none text-muted-foreground">
          Showing ping measurements over the last {Math.min(pingHistory.length, MAX_DATA_POINTS)} seconds
        </div>
      </CardFooter>
    </Card>
  )
}