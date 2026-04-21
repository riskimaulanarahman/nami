import { getApiBaseUrl } from './tenant';

type ApiAuthType = 'staff' | 'tenant' | 'none';

type ApiRequestOptions = RequestInit & {
  authType?: ApiAuthType;
};

function resolveStoredToken(authType: ApiAuthType): string | null {
  if (typeof window === 'undefined') return null;
  if (authType === 'none') return null;
  return authType === 'tenant'
    ? localStorage.getItem('tenant_token')
    : localStorage.getItem('auth_token');
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { authType = 'staff', ...fetchOptions } = options;
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/${path.replace(/^\//, '')}`;

  const headers = new Headers(fetchOptions.headers);
  
  const token = resolveStoredToken(authType);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Set default headers
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  headers.set('Accept', 'application/json');

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API error: ${response.status}`);
  }

  return response.json();
}
