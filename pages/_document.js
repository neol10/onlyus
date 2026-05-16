import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="pt-BR">
      <Head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#6366f1" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="OnlyUs" />
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
