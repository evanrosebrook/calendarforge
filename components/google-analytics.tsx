import { GOOGLE_ANALYTICS_MEASUREMENT_ID, isGoogleAnalyticsMeasurementId } from "@/lib/google-analytics";

const marketingParameters = [
  "dclid",
  "gad",
  "gad_campaignid",
  "gad_source",
  "gbraid",
  "gclid",
  "utm_campaign",
  "utm_content",
  "utm_medium",
  "utm_source",
  "utm_term",
  "wbraid",
] as const;

export function GoogleAnalytics() {
  if (!isGoogleAnalyticsMeasurementId(GOOGLE_ANALYTICS_MEASUREMENT_ID)) return null;
  const measurementId = JSON.stringify(GOOGLE_ANALYTICS_MEASUREMENT_ID);
  const allowedParameters = JSON.stringify(marketingParameters);
  const bootstrap = `
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function(){window.dataLayer.push(arguments);};
    window.gtag('js', new Date());
    (function(){
      var page = new URL(window.location.href);
      var allowed = new Set(${allowedParameters});
      Array.from(page.searchParams.keys()).forEach(function(key){
        if (!allowed.has(key)) page.searchParams.delete(key);
      });
      var referrer = '';
      try {
        var referrerUrl = new URL(document.referrer);
        referrer = referrerUrl.origin + referrerUrl.pathname;
      } catch (_) {}
      window.gtag('config', ${measurementId}, {
        page_location: page.toString(),
        page_referrer: referrer,
        allow_google_signals: false,
        allow_ad_personalization_signals: false
      });
    })();
  `;

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: bootstrap }} />
      <script async src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_MEASUREMENT_ID}`} />
    </>
  );
}
