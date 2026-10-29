# Calculator measurement and traffic-quality review

## October 29, 2026 cutover

The previous `calculator_result` event confirmed that a configured result was rendered. It did not establish that someone submitted a calculation. Since it was a GA4 key event, opening a result URL could also qualify the session as engaged.

The replacement definitions are:

| Event | Meaning | GA4 key event |
| --- | --- | --- |
| `calculator_result_view` | A valid configured result was displayed, including a shared URL or refresh. | No |
| `calculator_complete` | A valid result matched a recent form submission, shortcut selection, or change to shift/pay-period settings in the browser tab. | Yes, once per event; no default monetary value |
| `calendar_print`, `calendar_export`, `calendar_share` | The corresponding action was invoked. A print event does not prove that a physical print job completed. | Yes |
| `calculator_result` | Legacy event, accepted for older clients and retained in historical reports. | Unmarked October 29 |

The browser stores a one-use marker for up to 60 seconds. It contains only a fingerprint of the destination, the calculator surface, interaction kind, and timestamp. Raw dates, birthdays, amounts, and other form inputs are not stored in the marker or sent in these analytics events. Native form submission, including Enter, continues to work; shortcuts are marked on ordinary same-tab clicks, not prefetches or modified/new-tab clicks. Invalid results do not mount the completion reporter. A refresh cannot consume the same marker again. Storage restrictions cause measurement to fail safely without blocking a calculation.

This is evidence of an interaction, not proof of a human. Browser automation can still submit forms, and a public GA4 measurement ID is not an authentication boundary. Keep the traffic-quality review alongside the new success metrics.

GA4 key-event changes affect future collection, not historical key-event totals. Do not compare the old and new event names as though their meanings were identical. Allow GA4 reporting time to process the new events.

References: [GA4 key events](https://support.google.com/analytics/answer/13128484?hl=en), [GA4 engaged-session definition](https://support.google.com/analytics/answer/12195621?hl=en).

## Saved reports

- Standard-report comparison: **Suspected calculator automation**. Conditions are Country exactly `Singapore` AND Session source / medium exactly `(direct) / (none)` AND Landing page + query string exactly one of `/date-calculator/business-days`, `/date-calculator/add-subtract`, or `/date-calculator/days-between`.
- Saved session segment: **Remaining traffic - calculator burst excluded**. Excludes only sessions matching all three conditions above; the path condition is the anchored regex `^/date-calculator/(business-days|add-subtract|days-between)$`. Other Singapore sessions remain included. No collection filter, permanent country block, or historical deletion was configured.
- [CalendarForge traffic quality - raw vs filtered](https://analytics.google.com/analytics/web/#/analysis/a403150925p548118757/edit/LEL9fwfHRwyddub5JZzIDw): **Daily traffic quality** tab. The two segments show sessions, engaged sessions, and key events by day. Change the date picker to review a later period. The remaining segment is not a verified-human audience.

At creation, the October 22-28 exploration showed 692 all-traffic sessions, 622 engaged sessions, and 612 key events; the remaining segment showed 82 sessions, 15 engaged sessions, and three key events. Standard reports showed 694 sessions for the same dates. Keep each report's counts with its source rather than forcing exact reconciliation across GA4 surfaces. The exclusion is a diagnostic view, not a definitive bot count.

## Investigation of the October burst

- Standard reports, October 22-28 versus October 15-21: 694 versus 292 sessions; 611 latest-week sessions landed on the three affected calculators from Singapore, with average engagement rounded to zero seconds. There were 610 `calculator_result` events versus 134 the previous week.
- The daily event breakdown placed 548 calculator-result events on October 28 and 61 on October 27. The hostname was `calendarforge.net`; this rules out a visibly different hostname in the report, but cannot validate the sender.
- Retained production-container logs began October 22 at 15:50:40 UTC. For the available portion of the October 22-28 Pacific window, they contained 16 calculator-result events. The beginning of October 22 was unavailable after the preceding deployment, so this is not a complete weekly log count. The main October 27-28 burst occurred while these logs were intact.
- Apache recorded 306 telemetry POSTs in the full October 22-28 Pacific window, all HTTP 204. October 28 had only 86 telemetry POSTs across all event kinds, compared with 548 calculator-result events alone in GA4. There was no corresponding telemetry HTTP-error spike.
- The three calculator paths also received 16,844 document GETs (16,832 HTTP 200 and 12 redirects) and 5,314 RSC requests in that window. The leading labeled document-request agents were Bytespider (8,536), PetalBot (3,212), and SERankingBacklinksBot (796). These are HTTP requests, not GA4 sessions or verified people, and cannot be joined to individual GA4 users from the available data.

The discrepancy is not explained by a different reported hostname, the missing start of October 22, or an observed telemetry HTTP-error burst. Automated collection with incomplete first-party beacons and events sent directly to GA4 remain possibilities; the available evidence cannot distinguish them. Do not present the filtered cohort as confirmed measurement-protocol spam, and do not claim the tracking change eliminates bots.

## Release verification

- 194 tests passed; ESLint, TypeScript, and the 313-page production build passed.
- Local browser verification with GA4 disabled: a shared result URL emitted only a result view; Enter submission emitted one completion with `interaction=form`; refresh emitted no completion; two deliberate shortcut clicks emitted one completion each; reversed age dates showed an error with no completion; a pay-period setting change emitted one completion with `interaction=settings`.
- Rollout uses the versioned droplet pipeline. Record the deployed image and live verification in `launch-status.md`.
- For the next checkpoint, compare `calculator_complete`, prints, exports, shares, meaningful time on page, and search/referral landings in both raw and filtered reports. Investigate any renewed GA4/first-party mismatch before interpreting a new alert as growth.
