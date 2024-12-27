import { NextRequest, NextResponse } from 'next/server';
import ApplicationMetrics from '@/models/ApplicationMetrics';
import dbConnect from '@/dbConfig/dbConfig';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const timeRange = searchParams.get('timeRange') || '24h';

    // Calculate the start date based on time range
    const now = new Date();
    let startDate = new Date();
    switch (timeRange) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      default: // 24h
        startDate.setDate(now.getDate() - 1);
    }

    const metrics = await ApplicationMetrics.find({
      applicationId: params.id,
      timestamp: { $gte: startDate }
    })
    .sort({ timestamp: 1 })
    .lean();

    // If no metrics exist, generate sample data points
    if (metrics.length === 0) {
      const interval = timeRange === '24h' ? 3600000 : // 1 hour
                      timeRange === '7d' ? 21600000 : // 6 hours
                      timeRange === '30d' ? 86400000 : // 1 day
                      259200000; // 3 days for 90d

      const sampleData = [];
      for (let timestamp = startDate.getTime(); timestamp <= now.getTime(); timestamp += interval) {
        sampleData.push({
          timestamp: new Date(timestamp).toISOString(),
          activeUsers: 0,
          messageCount: 0,
          responseTime: 0
        });
      }

      return NextResponse.json({ 
        success: true,
        data: sampleData 
      });
    }

    return NextResponse.json({ 
      success: true,
      data: metrics.map(m => ({
        timestamp: m.timestamp.toISOString(),
        activeUsers: m.activeUsers,
        messageCount: m.messageCount,
        responseTime: m.responseTime
      }))
    });

  } catch (error) {
    console.error('Error fetching metrics:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch application metrics',
        data: [] 
      },
      { status: 500 }
    );
  }
}
