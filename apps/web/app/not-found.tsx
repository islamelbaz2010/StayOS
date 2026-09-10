export default function NotFound() {
  return (
    <html lang="en" dir="ltr">
      <body>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "0.5rem" }}>404 - Page Not Found</h1>
          <p style={{ color: "#666", marginBottom: "1.5rem" }}>The page you are looking for does not exist.</p>
          <a href="/" style={{ color: "#0d9488", fontWeight: 600, textDecoration: "underline" }}>Go home</a>
        </div>
      </body>
    </html>
  );
}
