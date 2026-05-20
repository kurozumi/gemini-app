import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { level, message, data } = await request.json();
    const timestamp = new Date().toLocaleString('ja-JP');
    const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message} ${data ? JSON.stringify(data) : ''}`;

    if (level === 'error') {
      console.error(logEntry);
    } else if (level === 'warn') {
      console.warn(logEntry);
    } else {
      console.log(logEntry);
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
