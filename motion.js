// Page motion: the sticky header, scroll reveals, the mascot's faces (an inline SVG
// so it can blink and switch expressions) and the hero demo, which loops through
// copy → flagged → placeholder filled → Humanize → sounds human.
// With prefers-reduced-motion nothing loops and the demo stays on its static frame.
;(function () {
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // ---- header: solid bar once the page scrolls ------------------------------------
  var head = document.querySelector('.site-head')
  function onScroll() {
    head.classList.toggle('scrolled', window.scrollY > 8)
  }
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()

  // "Get notified" scrolls to the form and puts the cursor in the email box.
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href="#notify"]')
    if (!a) return
    var target = document.getElementById('notify')
    if (!target) return
    e.preventDefault()
    target.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'start' })
    var email = target.querySelector('input[type="email"]')
    if (email) setTimeout(function () { email.focus({ preventScroll: true }) }, still ? 0 : 650)
  })

  // ---- scroll reveals ---------------------------------------------------------------
  var groups = document.querySelectorAll(
    'main section h2, main section .sub, .grid3, .promise, #faq details, .final .mascot, .final .notify'
  )
  var items = []
  Array.prototype.forEach.call(groups, function (el) {
    // A grid reveals its cards one after another.
    var kids = el.classList.contains('grid3') ? el.children : [el]
    Array.prototype.forEach.call(kids, function (k, i) {
      k.classList.add('reveal')
      k.style.setProperty('--d', i * 110 + 'ms')
      items.push(k)
    })
  })
  if (still || !('IntersectionObserver' in window)) {
    items.forEach(function (k) { k.classList.add('in') })
  } else {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return
          en.target.classList.add('in')
          io.unobserve(en.target)
        })
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
    )
    items.forEach(function (k) { io.observe(k) })
  }

  // ---- mascot: the app's pixel face, built from the same 14×15 grid ----------------
  var PALETTE = { h: '#6b4a2b', s: '#f0c8a0', w: '#fff', e: '#1b2330', m: '#7d4a4a' }
  var HAPPY = [
    '...hhhhhhhh...',
    '..hhhhhhhhhh..',
    '.hhhhhhhhhhhh.',
    '.hhsssssssshh.',
    '.hssssssssssh.',
    '.sswwsssswwss.',
    '.sswessssewss.',
    'ssssssssssssss',
    'ssssssssssssss',
    '.ssssssssssss.',
    '.ssssmsssmsss.',
    '.sssssmmmssss.',
    '..ssssssssss..',
    '...ssssssss...',
    '....ssssss....'
  ]
  // Shocked differs only in the brows, the eyes and the "o" mouth.
  var SHOCKED = HAPPY.slice()
  SHOCKED[3] = '.hheesssseehh.'
  SHOCKED[5] = '.sswessssewss.'
  SHOCKED[6] = '.sswwsssswwss.'
  SHOCKED[10] = '.sssssmmmssss.'
  SHOCKED[11] = '.sssssmsmssss.'
  SHOCKED[12] = '..ssssmmmsss..'

  // One rect per horizontal run of a colour. With `base`, only the pixels that
  // differ from it are drawn (an overlay on top of the base face).
  function rects(rows, base) {
    var out = ''
    rows.forEach(function (row, y) {
      var draw = row.split('').map(function (c, x) {
        return c !== '.' && (!base || base[y][x] !== c) ? c : null
      })
      for (var x = 0; x < draw.length; x++) {
        if (!draw[x]) continue
        var run = 1
        while (draw[x + run] === draw[x]) run++
        out += '<rect x="' + x + '" y="' + y + '" width="' + run + '" height="1" fill="' + PALETTE[draw[x]] + '"/>'
        x += run - 1
      }
    })
    return out
  }
  // Closed eyes: skin over both eyes with a dark lash line underneath.
  var BLINK = '<rect x="3" y="5" width="2" height="1" fill="' + PALETTE.s + '"/>' +
    '<rect x="9" y="5" width="2" height="1" fill="' + PALETTE.s + '"/>' +
    '<rect x="3" y="6" width="2" height="1" fill="' + PALETTE.e + '"/>' +
    '<rect x="9" y="6" width="2" height="1" fill="' + PALETTE.e + '"/>'
  var FACE =
    '<svg viewBox="0 0 14 15" shape-rendering="crispEdges" aria-hidden="true">' +
    rects(HAPPY) +
    '<g class="face-shocked">' + rects(SHOCKED, HAPPY) + '</g>' +
    '<g class="face-blink">' + BLINK + '</g></svg>'

  var mascots = document.querySelectorAll('.mascot[data-face]')
  Array.prototype.forEach.call(mascots, function (m) {
    m.innerHTML = FACE
    m.addEventListener('mouseenter', function () { hop(m) })
  })

  function hop(m) {
    if (still) return
    m.classList.remove('hop')
    void m.offsetWidth // restart the animation
    m.classList.add('hop')
  }
  Array.prototype.forEach.call(mascots, function (m) {
    m.addEventListener('animationend', function (e) {
      if (e.animationName === 'hop') m.classList.remove('hop')
    })
  })
  function face(m, name) {
    m.dataset.face = name
    m.classList.toggle('calm', name === 'happy')
  }

  // ---- hero demo --------------------------------------------------------------------
  var fig = document.querySelector('.demo')
  if (!fig || still) return

  function $(sel) { return fig.querySelector(sel) }
  var ph = $('.ph')
  var ai = $('.ailine')
  var tone = $('.tone')
  var pii = $('.pii')
  var scoreEl = $('[data-score]')
  var verdict = $('[data-verdict]')
  var meter = $('.meter i')
  var wPh = $('.w-ph')
  var wAi = $('.w-ai')
  var priv = $('.private')
  var btn = $('.humanize')
  var mascot = $('.mascot')
  // If the page and this script ever come from different deploys (a stale cache),
  // leave the demo on its static frame instead of freezing half way through.
  if (![ph, ai, tone, pii, scoreEl, verdict, meter, wPh, wAi, priv, btn, mascot].every(Boolean) ||
      !tone.dataset.new) return
  var orig = {
    ph: ph.textContent,
    tone: tone.textContent,
    wPh: wPh.querySelector('strong').textContent,
    wAi: wAi.querySelector('strong').textContent,
    verdict: verdict.textContent,
    btn: btn.textContent
  }

  var onScreen = true
  var wake = null
  new IntersectionObserver(function (entries) {
    onScreen = entries[0].isIntersecting
    if (onScreen && wake) { wake(); wake = null }
  }).observe(fig)

  function sleep(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms) })
  }
  function visible() {
    return onScreen ? Promise.resolve() : new Promise(function (r) { wake = r })
  }
  function type(el, text, ms) {
    var caret = document.createElement('span')
    caret.className = 'caret'
    var i = 0
    return new Promise(function (resolve) {
      ;(function step() {
        el.textContent = text.slice(0, i)
        el.appendChild(caret)
        if (i++ < text.length) return setTimeout(step, ms)
        setTimeout(function () { caret.remove(); resolve() }, 350)
      })()
    })
  }
  var score = 88
  function setScore(v) {
    score = v
    scoreEl.textContent = v
    meter.style.width = v + '%'
  }
  function count(to, ms) {
    var from = score
    var t0 = performance.now()
    var done = false
    return new Promise(function (resolve) {
      function finish() {
        if (done) return
        done = true
        setScore(to)
        resolve()
      }
      ;(function frame(now) {
        if (done) return
        var t = Math.min(1, (now - t0) / ms)
        if (t >= 1) return finish()
        setScore(Math.round(from + (to - from) * (1 - Math.pow(1 - t, 3))))
        requestAnimationFrame(frame)
      })(t0)
      // Browsers stop animation frames while the page isn't painted (background tab,
      // covered or minimised window), so never let the loop wait on them.
      setTimeout(finish, ms + 50)
    })
  }
  function fix(warn) {
    var strong = warn.querySelector('strong')
    strong.textContent = strong.dataset.fixed
    warn.classList.add('fixed')
  }

  function reset() {
    fig.className = 'demo is-idle'
    ph.className = 'ph'
    ph.textContent = orig.ph
    ai.className = 'ailine'
    tone.className = 'tone'
    tone.textContent = orig.tone
    pii.className = 'pii'
    wPh.className = 'warn w-ph'
    wPh.querySelector('strong').textContent = orig.wPh
    wAi.className = 'warn w-ai'
    wAi.querySelector('strong').textContent = orig.wAi
    verdict.textContent = orig.verdict
    btn.textContent = orig.btn
    btn.className = 'humanize'
    priv.classList.remove('held')
    score = 88
    scoreEl.textContent = score
    meter.style.width = ''
    face(mascot, 'happy')
  }

  async function loop() {
    for (;;) {
      reset()
      await visible()
      await sleep(900)

      // 1. the draft is copied
      fig.classList.add('is-copying')
      await sleep(850)
      fig.classList.replace('is-copying', 'is-copied')

      // 2. the mascot spots the tells
      fig.classList.remove('is-idle')
      face(mascot, 'shocked')
      hop(mascot)
      await sleep(1800)

      // 3. the writer fills in the placeholder
      ph.classList.add('selecting')
      await sleep(500)
      ph.classList.remove('selecting')
      await type(ph, 'Priya', 95)
      ph.classList.add('done')
      fix(wPh)
      await count(46, 700)
      await sleep(700)

      // 4. Humanize: the pasted chatbot line goes, then the email is rewritten in the
      //    Professional tone; the email address never leaves the device
      btn.classList.add('pressed')
      await sleep(160)
      btn.classList.remove('pressed')
      btn.classList.add('working')
      btn.textContent = 'HUMANIZING · Professional ✨'
      pii.classList.add('held')
      priv.classList.add('held')
      ai.classList.add('striking')
      await sleep(800)
      ai.classList.add('gone')
      fix(wAi)
      await sleep(600)
      fig.classList.add('is-toned')
      // The rewrite arrives whole, so it replaces the selection like a paste.
      // Soft: a pale highlight, a slow fade out and in, then the highlight melts away.
      tone.classList.add('selecting')
      await sleep(800)
      tone.classList.add('swapping')
      await sleep(500)
      tone.textContent = tone.dataset.new
      tone.classList.remove('swapping')
      await sleep(700)
      tone.classList.remove('selecting')
      await sleep(500)
      btn.classList.remove('working')
      btn.textContent = 'REWRITTEN ✓'

      // 5. sounds human: the mascot cheers up
      await count(12, 900)
      fig.classList.add('is-human')
      verdict.textContent = 'SOUNDS HUMAN'
      face(mascot, 'happy')
      hop(mascot)
      await sleep(4500) // long enough to read the finished email

      fig.classList.add('is-fading')
      await sleep(450)
    }
  }
  loop().catch(function (e) {
    // Never leave the demo half hidden or fading: keep the bubble on screen and stop.
    console.error('Human-nicer demo stopped:', e)
    fig.className = 'demo is-copied'
  })
})()
