const DEFAULT_PROD_API_BASE_URL = 'https://pos.togoldarea.com/api';
const DEFAULT_DEV_API_BASE_URL = 'http://127.0.0.1:8000/api';

export function getCentralApiBaseUrl(): string {
	const fallbackBaseUrl = process.env.NODE_ENV === 'development'
		? DEFAULT_DEV_API_BASE_URL
		: DEFAULT_PROD_API_BASE_URL;

	return (process.env.NEXT_PUBLIC_API_URL || fallbackBaseUrl).replace(
		/\/+$/,
		'',
	);
}

export function getApiBaseUrl(): string {
	return getCentralApiBaseUrl();
}
