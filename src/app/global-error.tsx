"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "3rem", textAlign: "center" }}>
        <h1>Something went wrong</h1>
        <button type="button" onClick={reset}>
          Try again
        </button>
      </body>
    </html>
  );
}
