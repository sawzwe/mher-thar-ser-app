"use client";

import { useEffect, useRef } from "react";

export default function ApiDocsPage() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js";
    script.onload = () => {
      // @ts-expect-error -- loaded via CDN
      window.SwaggerUIBundle({
        url: "/api/docs",
        dom_id: "#swagger-ui",
        presets: [
          // @ts-expect-error -- loaded via CDN
          window.SwaggerUIBundle.presets.apis,
          // @ts-expect-error -- loaded via CDN
          window.SwaggerUIBundle.SwaggerUIStandalonePreset,
        ],
        layout: "BaseLayout",
        deepLinking: true,
        defaultModelsExpandDepth: 1,
        defaultModelExpandDepth: 1,
      });
    };
    document.body.appendChild(script);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <div id="swagger-ui" />
    </div>
  );
}
