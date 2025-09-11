export default function NotFound() {
  return (
    <html>
      <head>
        <title>404 - Page Not Found</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            background-color: #f5f5f5;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
          }
          .container {
            text-align: center;
            max-width: 500px;
            padding: 2rem;
          }
          h1 {
            font-size: 4rem;
            margin: 0 0 1rem 0;
            color: #333;
          }
          h2 {
            font-size: 1.5rem;
            margin: 0 0 1rem 0;
            color: #666;
          }
          p {
            font-size: 1rem;
            color: #888;
            margin-bottom: 2rem;
          }
          a {
            display: inline-block;
            padding: 12px 24px;
            background-color: #1976d2;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            font-weight: 500;
          }
          a:hover {
            background-color: #1565c0;
          }
        `}</style>
      </head>
      <body>
        <div className="container">
          <h1>404</h1>
          <h2>Page Not Found</h2>
          <p>The page you&apos;re looking for doesn&apos;t exist.</p>
          <p>Please check the URL and try again.</p>
        </div>
      </body>
    </html>
  );
}
