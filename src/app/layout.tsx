import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "TOGA POS - Point of Sale System Premium",
  description: "Point of Sale system modern untuk Billiard & Cafe. Kelola operasional lebih cerdas.",
  icons: {
    icon: "/favicon.ico",
  },
};

// Auto-reload when Next.js chunk load fails after a new deployment.
// Uses sessionStorage to prevent infinite reload loops (max 3 attempts per session).
const chunkErrorRecoveryScript = `
(function(){
  function isChunkError(msg) {
    return msg && (msg.indexOf('ChunkLoadError') !== -1 || msg.indexOf('Loading chunk') !== -1 || msg.indexOf('Failed to load chunk') !== -1);
  }
  function tryReload() {
    try {
      var key = 'chunk_reload_count';
      var count = parseInt(sessionStorage.getItem(key) || '0', 10);
      if (count < 3) {
        sessionStorage.setItem(key, String(count + 1));
        window.location.reload();
      }
    } catch(e) {}
  }
  window.addEventListener('error', function(e) {
    if (isChunkError(e.message)) tryReload();
  });
  window.addEventListener('unhandledrejection', function(e) {
    var msg = e.reason && (e.reason.message || String(e.reason));
    if (isChunkError(msg)) tryReload();
  });
})();
`;

// Inline script to normalize matchMedia APIs and prevent dark mode flash before React hydrates.
const bootstrapScript = `
(function(){
  try {
    var createFallbackMql = function(query) {
      return {
        matches: false,
        media: query,
        onchange: null,
        addListener: function() {},
        removeListener: function() {},
        addEventListener: function() {},
        removeEventListener: function() {},
        dispatchEvent: function() { return false; }
      };
    };

    var originalMatchMedia = window.matchMedia;
    if (typeof originalMatchMedia !== 'function') {
      window.matchMedia = createFallbackMql;
    } else {
      window.matchMedia = function(query) {
        var mql = originalMatchMedia.call(window, query);
        if (!mql) return createFallbackMql(query);

        if (typeof mql.addListener !== 'function') {
          mql.addListener = function(listener) {
            if (typeof mql.addEventListener === 'function') {
              mql.addEventListener('change', listener);
            }
          };
        }

        if (typeof mql.removeListener !== 'function') {
          mql.removeListener = function(listener) {
            if (typeof mql.removeEventListener === 'function') {
              mql.removeEventListener('change', listener);
            }
          };
        }

        return mql;
      };
    }
  } catch(e) {}

  try {
    var t = localStorage.getItem('pos-theme');
    if (t === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch(e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: chunkErrorRecoveryScript }} />
        <script dangerouslySetInnerHTML={{ __html: bootstrapScript }} />
      </head>
      <body
        style={{
          ["--font-geist-sans" as string]: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          ["--font-geist-mono" as string]: '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
        }}
        className="antialiased bg-background text-foreground"
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
