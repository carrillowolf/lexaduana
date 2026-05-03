import Script from 'next/script'

export default function PlausibleAnalytics() {
  return (
    <>
      <Script
        defer
        src="https://plausible.io/js/pa-MxVnUWhxqMHgIZ0hcJTWR.js"
        strategy="afterInteractive"
      />
      <Script id="plausible-init" strategy="afterInteractive">
        {`
          window.plausible = window.plausible || function() {
            (plausible.q = plausible.q || []).push(arguments)
          };
          plausible.init = plausible.init || function(i) { plausible.o = i || {} };
          plausible.init();
        `}
      </Script>
    </>
  )
}
