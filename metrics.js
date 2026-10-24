// Cookieless visit counting. One beacon per page view with the path, the host of
// the site that linked here, and any utm_ tags; one more when a download button is
// clicked. No cookies, no storage, no IP addresses kept (see privacy.html).
;(function () {
  var ENDPOINT = 'https://beaaeqnqmomdfatdsivf.supabase.co/functions/v1/metrics'
  if (!/(^|\.)humannicer\.com$/.test(location.hostname)) return // not on local previews

  var params = new URLSearchParams(location.search)
  function send(kind, extra) {
    var body = {
      kind: kind,
      path: location.pathname,
      referrer: document.referrer || null,
      utm_source: params.get('utm_source'),
      utm_medium: params.get('utm_medium'),
      utm_campaign: params.get('utm_campaign')
    }
    for (var k in extra || {}) body[k] = extra[k]
    var data = new Blob([JSON.stringify(body)], { type: 'text/plain' })
    if (!(navigator.sendBeacon && navigator.sendBeacon(ENDPOINT, data))) {
      fetch(ENDPOINT, { method: 'POST', body: data, keepalive: true }).catch(function () {})
    }
  }

  send('visit')
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[data-download]')
    if (a) send('download')
  })
  window.humanNicerMetrics = { send: send }
})()
