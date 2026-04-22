"use client";

import Script from "next/script";

type Props = {
  gtmContainerId: string;
};

/**
 * Google Tag Manager loader. Container id is validated on the server before render.
 */
export function MarketingScripts({ gtmContainerId }: Props) {
  const id = gtmContainerId;
  if (!/^GTM-[A-Z0-9]+$/i.test(id)) return null;

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
