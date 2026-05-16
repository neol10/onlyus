import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="pt-BR">
      <Head>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossOrigin="" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0f172a" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="OnlyUs" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="application-name" content="OnlyUs" />
        <meta name="msapplication-TileColor" content="#0f172a" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const userId = localStorage.getItem('onlyus-active-user-id');
                  const storageKey = userId ? 'onlyus-settings-' + userId : 'onlyus-settings-guest';
                  const settings = JSON.parse(localStorage.getItem(storageKey));
                  if (settings && settings.uiMode === 'Escuro') {
                    document.documentElement.dataset.uiMode = 'Escuro';
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.dataset.uiMode = 'Claro';
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })()
            `,
          }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
