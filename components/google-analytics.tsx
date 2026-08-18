import { GOOGLE_ANALYTICS_MEASUREMENT_ID, isGoogleAnalyticsMeasurementId } from "@/lib/google-analytics";
import { AUTOMATED_USER_AGENT_SOURCE } from "@/lib/bot-detection";

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
  const bootstrap = buildGoogleAnalyticsBootstrap(GOOGLE_ANALYTICS_MEASUREMENT_ID);

  return <script dangerouslySetInnerHTML={{ __html: bootstrap }} />;
}

export function buildGoogleAnalyticsBootstrap(measurementId: string): string {
  const serializedMeasurementId = JSON.stringify(measurementId);
  const allowedParameters = JSON.stringify(marketingParameters);
  const automatedPattern = JSON.stringify(AUTOMATED_USER_AGENT_SOURCE);
  return `
    (function(){
      if (new RegExp(${automatedPattern}, 'i').test(navigator.userAgent || '')) return;
      window.dataLayer = window.dataLayer || [];
      window.gtag = window.gtag || function(){window.dataLayer.push(arguments);};
      window.gtag('js', new Date());
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
      window.gtag('config', ${serializedMeasurementId}, {
        page_location: page.toString(),
        page_referrer: referrer,
        allow_google_signals: false,
        allow_ad_personalization_signals: false
      });
      var script = document.createElement('script');
      script.async = true;
      script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(${serializedMeasurementId});
      document.head.appendChild(script);
    })();
  `;
}
