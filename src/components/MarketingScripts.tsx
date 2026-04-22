"use client";

import Script from "next/script";

/**
 * GTM loader — client component so next/script afterInteractive works correctly.
 * ID is validated server-side before this component is rendered.
 */
export function GtmScript({ gtmContainerId }: { gtmContainerId: string }) {
  if (!/^GTM-[A-Z0-9]+$/i.test(gtmContainerId)) return null;
  const id = gtmContainerId;
  return (
    <Script
      id="gtm-base"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${id}');`,
      }}
    />
  );
}
