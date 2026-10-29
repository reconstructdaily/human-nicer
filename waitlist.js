// "Notify me" forms: saves the email and the platforms picked to the launch waitlist
// (supabase/migrations/0008_launch_waitlist.sql) through the public anon key, which
// can only call join_launch_waitlist(). We email each address once per platform when
// it launches (scripts/notify-waitlist.mjs).
;(function () {
  var SUPABASE_URL = 'https://beaaeqnqmomdfatdsivf.supabase.co'
  var ANON_KEY = 'sb_publishable_5dm8gJAxvdm6u18_HS-g6A_ipBq71uo'
  var EMAIL = /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i

  var source = new URLSearchParams(location.search).get('utm_source') || 'site'

  function setMsg(form, text, kind) {
    var msg = form.querySelector('.notify-msg')
    msg.textContent = text
    msg.className = 'notify-msg' + (kind ? ' ' + kind : '')
  }

  function submit(form, e) {
    e.preventDefault()
    if (form.elements.website.value) return // honeypot: only bots fill this

    var email = form.elements.email.value.trim()
    var platforms = Array.prototype.slice
      .call(form.querySelectorAll('input[name="platform"]:checked'))
      .map(function (b) { return b.value })
    if (!EMAIL.test(email)) return setMsg(form, 'That email doesn\'t look right.', 'err')
    if (!platforms.length) return setMsg(form, 'Pick the Windows app, the Chrome extension, or both.', 'err')

    var button = form.querySelector('button[type="submit"]')
    button.disabled = true
    setMsg(form, 'Saving…')
    fetch(SUPABASE_URL + '/rest/v1/rpc/join_launch_waitlist', {
      method: 'POST',
      headers: { apikey: ANON_KEY, 'content-type': 'application/json' },
      body: JSON.stringify({ p_email: email, p_platforms: platforms, p_source: source })
    })
      .then(function (res) { return res.ok ? res.json() : 'error' })
      .then(function (result) {
        if (result === 'ok') {
          form.classList.add('done')
          setMsg(form, 'You\'re on the list. We\'ll email ' + email + ' once, when it\'s out.', 'ok')
        } else if (result === 'invalid') {
          setMsg(form, 'That email doesn\'t look right.', 'err')
        } else {
          setMsg(form, 'Couldn\'t save that just now. Please try again in a minute.', 'err')
        }
      })
      .catch(function () {
        setMsg(form, 'Couldn\'t reach the server. Check your connection and try again.', 'err')
      })
      .then(function () { button.disabled = false })
  }

  Array.prototype.forEach.call(document.querySelectorAll('form[data-waitlist]'), function (form) {
    form.addEventListener('submit', function (e) { submit(form, e) })
  })
})()
