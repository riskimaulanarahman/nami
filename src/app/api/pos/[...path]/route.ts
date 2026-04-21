import { NextRequest, NextResponse } from 'next/server';
import { getCentralApiBaseUrl } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'content-length',
  'host',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
]);

function buildTargetUrl(request: NextRequest, path: string[]): string {
  const baseUrl = getCentralApiBaseUrl();
  const normalizedPath = path.map(encodeURIComponent).join('/');
  const search = request.nextUrl.search;

  return `${baseUrl}/${normalizedPath}${search}`;
}

function buildForwardHeaders(request: NextRequest): Headers {
  const headers = new Headers();

  request.headers.forEach((value, key) => {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  return headers;
}

function buildResponseHeaders(upstreamHeaders: Headers): Headers {
  const headers = new Headers();

  upstreamHeaders.forEach((value, key) => {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  return headers;
}

async function proxyRequest(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> {
  const { path } = await context.params;
  const targetUrl = buildTargetUrl(request, path);
  const method = request.method.toUpperCase();
  const canHaveBody = method !== 'GET' && method !== 'HEAD';

  const upstreamResponse = await fetch(targetUrl, {
    method,
    headers: buildForwardHeaders(request),
    body: canHaveBody ? await request.text() : undefined,
    cache: 'no-store',
    redirect: 'manual',
  });

  return new NextResponse(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers: buildResponseHeaders(upstreamResponse.headers),
  });
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> {
  return proxyRequest(request, context);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> {
  return proxyRequest(request, context);
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> {
  return proxyRequest(request, context);
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> {
  return proxyRequest(request, context);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> {
  return proxyRequest(request, context);
}

export async function OPTIONS(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> {
  return proxyRequest(request, context);
}

