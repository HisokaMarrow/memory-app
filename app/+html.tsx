// ─────────────────────────────────────────────────────────────────────────────
// HTML shell — runs at build time / server render, before any JS executes.
// Fonts and global CSS go here so there is never a flash of unstyled text.
// ─────────────────────────────────────────────────────────────────────────────
import { ScrollViewStyleReset } from "expo-router/html";

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        {/* Expo ScrollView requires this reset to work on web */}
        <ScrollViewStyleReset />

        {/* ── Fonts ── loaded before JS so text is never re-styled mid-render */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&family=Inter:wght@400;500;600;700&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,400;1,600&display=block"
        />

        <script dangerouslySetInnerHTML={{ __html: `
          (() => {
            const nativeWarn = console.warn;
            console.warn = (...args) => {
              const message = args.map((part) => String(part ?? "")).join(" ");
              if (message.startsWith("Animated:") && message.includes("useNativeDriver") && message.includes("not supported")) return;
              nativeWarn.apply(console, args);
            };
          })();
        `}} />

        {/* ── Global CSS ── defined here so they exist before first paint */}
        <style dangerouslySetInnerHTML={{ __html: `
          *, *::before, *::after { box-sizing: border-box; }
          html, body {
            margin: 0;
            padding: 0;
            height: 100%;
            background: #0A0A0A;
            overscroll-behavior: none;
          }
          body { overflow: hidden; }
          #root { height: 100%; background: #0A0A0A; overscroll-behavior: none; }
          [data-testid="ScrollView"] {
            overscroll-behavior: none;
            overscroll-behavior-x: none;
            overscroll-behavior-y: none;
          }
          #games-card-rail-scroller,
          #games-card-rail-scroller > div {
            background: transparent !important;
            background-color: transparent !important;
            background-image: none !important;
            box-shadow: none !important;
          }

          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(22px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to   { opacity: 1; }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50%       { opacity: 0.35; }
          }
          @keyframes shimmer {
            0%   { background-position: 120% 0; }
            100% { background-position: -120% 0; }
          }
        `}} />
      </head>
      <body>{children}</body>
    </html>
  );
}
