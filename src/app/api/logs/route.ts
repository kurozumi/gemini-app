import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const { level, message, data } = await request.json();
    const logFile = path.join(process.cwd(), 'debug.log');
    const timestamp = new Date().toLocaleString('ja-JP');
    const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message} ${data ? JSON.stringify(data) : ''}\n`;

    console.log('Writing to log file:', logEntry); // サーバー側のコンソールにも出す
    fs.appendFileSync(logFile, logEntry, { encoding: 'utf8' });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to write log:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
