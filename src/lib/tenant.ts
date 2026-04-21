const DEFAULT_API_BASE_URL = 'https://pos.togoldarea.com/api';
const APP_API_PROXY_BASE_URL = '/api/pos';

export function getCentralApiBaseUrl(): string {
	return (process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_BASE_URL).replace(
		/\/+$/,
		'',
	);
}

export function getApiBaseUrl(): string {
	if (typeof window !== 'undefined') {
		return APP_API_PROXY_BASE_URL;
	}

	return getCentralApiBaseUrl();
}
