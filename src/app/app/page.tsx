import PosAppShell from '@/components/pos/PosAppShell';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function AppPage() {
  return <PosAppShell routeMode="app" />;
}
