import { NextResponse } from 'next/server';

export async function GET() {
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'trading-dashboard-frontend',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
  };

  return NextResponse.json(healthCheck, { status: 200 });
}