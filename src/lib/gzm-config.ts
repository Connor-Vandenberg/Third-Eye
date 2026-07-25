/**
 * GZM Backend Configuration.
 * 
 * The API URL defaults to localhost:8000 in development.
 * Set GZM_API_URL environment variable for production.
 */

export const GZM_API_URL = process.env.NEXT_PUBLIC_GZM_API_URL || process.env.GZM_API_URL || 'http://localhost:8000';

export const GZM_WS_URL = process.env.NEXT_PUBLIC_GZM_WS_URL || 'ws://localhost:8000';
