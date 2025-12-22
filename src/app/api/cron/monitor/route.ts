import { NextRequest, NextResponse } from 'next/server';
import { runIngestion } from '@/lib/ingest';
import { sendErrorNotification } from '@/lib/email';

export async function GET(request: NextRequest) {
  try {
    // Verify the request is from a cron job or authorized source
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret) {
      console.error('CRON_SECRET not configured');
      return NextResponse.json({ error: 'Cron secret not configured' }, { status: 500 });
    }
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error('Unauthorized cron request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 Starting automatic Reddit monitoring...');
    
    // Run the ingestion process
    const result = await runIngestion();
    
    console.log('✅ Automatic monitoring completed:', result);
    
    return NextResponse.json({
      success: true,
      message: 'Monitoring completed successfully',
      result
    });
    
  } catch (error) {
    console.error('❌ Error during automatic monitoring:', error);
    
    // Send error notification via email
    try {
      await sendErrorNotification(error as Error, 'Automatic Reddit Monitoring');
    } catch (emailError) {
      console.error('Failed to send error notification:', emailError);
    }
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

// Also support POST requests for flexibility
export async function POST(request: NextRequest) {
  return GET(request);
}