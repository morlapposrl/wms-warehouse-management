import { json } from '@sveltejs/kit';
import { db as database } from '$lib/server/database.js';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async () => {
  try {
    console.log('Testing database import:', typeof database);
    console.log('Database object keys:', database ? Object.keys(database) : 'undefined');
    console.log('Has prepare method:', typeof database?.prepare);

    if (!database) {
      return json({ error: 'Database is undefined' }, { status: 500 });
    }

    if (typeof database.prepare !== 'function') {
      return json({ error: 'Database prepare is not a function', type: typeof database.prepare }, { status: 500 });
    }

    // Simple test query
    const result = database.prepare('SELECT 1 as test').get();
    return json({ success: true, test_result: result });

  } catch (error) {
    console.error('Test DB Error:', error);
    return json({ error: error.message }, { status: 500 });
  }
};