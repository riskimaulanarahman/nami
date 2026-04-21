const DEFAULT_API_BASE_URL = 'http://localhost:8000/api';

export function getCentralApiBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_BASE_URL).replace(/\/+$/, '');
}

export function getApiBaseUrl(): string {
  return getCentralApiBaseUrl();
}

