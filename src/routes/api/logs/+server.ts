import { json } from '@sveltejs/kit';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export async function GET() {
  try {
    const logPath = join(process.cwd(), 'debug.log');
    
    if (!existsSync(logPath)) {
      return json({
        success: false,
        error: 'Log file not found',
        logs: 'Log file does not exist yet. Start the development server to generate logs.'
      });
    }
    
    // Leggi il file di log
    const logContent = readFileSync(logPath, 'utf-8');
    
    // Prendi solo le ultime 1000 righe per performance e invertile (più recente prima)
    const lines = logContent.split('\n');
    const recentLines = lines.slice(-1000).reverse().join('\n');
    
    return json({
      success: true,
      logs: recentLines,
      totalLines: lines.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error reading log file:', error);
    return json({
      success: false,
      error: 'Failed to read log file: ' + error.message,
      logs: 'Error occurred while reading the log file.'
    }, { status: 500 });
  }
}