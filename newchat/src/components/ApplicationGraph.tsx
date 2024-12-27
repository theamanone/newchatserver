'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ApplicationGraphProps {
  applicationId: string;
}

interface GraphData {
  timestamp: string;
  activeUsers: number;
  messageCount: number;
  responseTime: number;
}

export default function ApplicationGraph({ applicationId }: ApplicationGraphProps) {
  const [data, setData] = useState<GraphData[]>([]);
  const [timeRange, setTimeRange] = useState('24h');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchGraphData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/v1/superadmin/applications/${applicationId}/metrics?timeRange=${timeRange}`);
        const jsonData = await response.json();
        
        if (response.ok) {
          setData(jsonData.data);
        }
      } catch (error) {
        console.error('Failed to fetch graph data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGraphData();
  }, [applicationId, timeRange]);

  return (
    <Card className="w-full bg-card">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-foreground">Application Metrics</CardTitle>
            <CardDescription className="text-muted-foreground">
              Real-time application usage and performance metrics
            </CardDescription>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[400px] flex items-center justify-center">
            <div className="text-lg text-muted-foreground">Loading metrics...</div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="timestamp"
                className="text-muted-foreground"
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <YAxis className="text-muted-foreground" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="activeUsers"
                name="Active Users"
                stroke="hsl(var(--primary))"
                activeDot={{ r: 8 }}
              />
              <Line
                type="monotone"
                dataKey="messageCount"
                name="Messages"
                stroke="hsl(var(--secondary))"
                activeDot={{ r: 8 }}
              />
              <Line
                type="monotone"
                dataKey="responseTime"
                name="Response Time (ms)"
                stroke="hsl(var(--accent))"
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
