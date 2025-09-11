// Simple test to verify database connection
import { db } from './src/lib/server/database.ts';

try {
  console.log('Testing database connection...');
  
  // Test basic query
  const testQuery = db.prepare('SELECT COUNT(*) as count FROM committenti');
  const result = testQuery.get();
  
  console.log('Database test successful!');
  console.log('Committenti count:', result.count);
  
  // Test KPI-like query to reproduce the error
  const kpiQuery = `
    SELECT 
      (SELECT COUNT(*) FROM ordini WHERE date(created_at) = date('now')) as ordini_oggi,
      (SELECT COUNT(*) FROM movimenti WHERE date(data_movimento) = date('now')) as movimenti_oggi
  `;
  
  const kpiResult = db.prepare(kpiQuery).get();
  console.log('KPI test successful!');
  console.log('KPI result:', kpiResult);
  
} catch (error) {
  console.error('Database test failed:', error);
}