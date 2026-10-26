/* ==========================================================================
   script.js: Hassan portfolio
   Each feature lives in its own small function ("initSomething"), and they are
   all started at the bottom of the file. If one feature has a bug, the others
   still work as long as the error isn't thrown at the top level.

   HOW TO DEBUG
   1. Open the page, press F12, open the Console tab.
   2. A red message shows the file name and line number.
   3. "Cannot read properties of null" almost always means an ID or class used
      here does not exist in index.html (typo!). Compare the two files.
   ========================================================================== */
'use strict'; // strict mode turns silent mistakes (like undeclared variables) into visible errors


/* --------------------------------------------------------------------------
   0. SETTINGS: the things you will most likely want to change
   -------------------------------------------------------------------------- */
const SETTINGS = {
  // DEMO MODE: true  = the form only PRETENDS to send (nothing leaves the browser).
  //            false = the form really POSTs to formEndpoint below.
  demoMode: false,

  // When you create a form on a service like Formspree, Web3Forms or Getform,
  // they give you a URL. Paste it here and set demoMode to false.
  formEndpoint: 'https://formspree.io/f/mdeearbq',

  demoSuccessMessage:
    'Demo mode: your message was checked and looks good, but nothing was sent because no email service is connected yet.',
  realSuccessMessage: 'Thank you! Your message has been sent. I will get back to you soon.',
  errorMessage: 'Something went wrong while sending. Please try again, or email me directly.'
};

// Tell the CSS that JavaScript is running. style.css only hides ".reveal" elements
// when this class exists, so if this file fails to load, the page stays fully visible.
document.documentElement.classList.add('js-ready');

// Did the visitor ask their device for less motion? (true / false)
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;


/* --------------------------------------------------------------------------
   1. CURRENT YEAR (footer)
   -------------------------------------------------------------------------- */
function initYear() {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear(); // new Date() = "right now"
}


/* --------------------------------------------------------------------------
   2. HEADER: add a bottom border once the page has been scrolled
   "passive: true" tells the browser we will never block scrolling, so it stays smooth.
   -------------------------------------------------------------------------- */
function initHeader() {
  const header = document.getElementById('site-header');
  if (!header) return;

  const update = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  update(); // run once in case the page loads already scrolled
  window.addEventListener('scroll', update, { passive: true });
}


/* --------------------------------------------------------------------------
   3. MOBILE MENU
   The button carries aria-expanded="true/false". Screen readers read it, and
   style.css uses it to swap the hamburger and close icons.
   -------------------------------------------------------------------------- */
function initMobileMenu() {
  const button = document.getElementById('menu-toggle');
  const menu = document.getElementById('mobile-menu');
  if (!button || !menu) return;

  function setOpen(isOpen) {
    button.setAttribute('aria-expanded', String(isOpen));
    button.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
    menu.hidden = !isOpen; // the "hidden" attribute hides the element completely
  }

  // Click the button: flip between open and closed.
  button.addEventListener('click', () => {
    setOpen(button.getAttribute('aria-expanded') !== 'true');
  });

  // Click any link inside the menu: close it (the page scrolls to the section).
  menu.addEventListener('click', (event) => {
    if (event.target.closest('a')) setOpen(false);
  });

  // Escape closes the menu and returns focus to the button (keyboard users).
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !menu.hidden) {
      setOpen(false);
      button.focus();
    }
  });

  // If the window grows to desktop width, make sure the mobile menu is closed.
  window.matchMedia('(min-width: 768px)').addEventListener('change', (event) => {
    if (event.matches) setOpen(false);
  });
}


/* --------------------------------------------------------------------------
   4. ACTIVE NAV LINK (the blue outlined pill)
   We watch four sections with an IntersectionObserver. The rootMargin shrinks the
   "detection area" to a thin line in the middle of the screen, so whichever
   section crosses that line becomes the active one.
   -------------------------------------------------------------------------- */
function initActiveNav() {
  const links = document.querySelectorAll('[data-nav]');
  const sectionIds = ['home', 'work', 'about', 'contact'];
  const sections = sectionIds.map((id) => document.getElementById(id)).filter(Boolean);
  if (!('IntersectionObserver' in window) || sections.length === 0) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((link) => {
          if (link.getAttribute('href') === '#' + entry.target.id) {
            link.setAttribute('aria-current', 'true');   // the CSS styles this attribute
          } else {
            link.removeAttribute('aria-current');
          }
        });
      });
    },
    { rootMargin: '-45% 0px -50% 0px' }
  );

  sections.forEach((section) => observer.observe(section));
}


/* --------------------------------------------------------------------------
   5. SCROLL REVEAL (IntersectionObserver)
   Old way: listen to every scroll event and measure positions (slow).
   Better way: the browser TELLS us when an element enters the screen.
   Flow: element has class "reveal" (hidden by CSS) -> scrolls into view ->
   we add "is-visible" -> CSS transition fades it in -> we stop watching it.
   -------------------------------------------------------------------------- */
function initReveal() {
  const items = document.querySelectorAll('.reveal');

  // Old browser, or the visitor wants less motion? Show everything immediately.
  if (!('IntersectionObserver' in window) || prefersReducedMotion) {
    items.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {                  // true when the element is on screen
          entry.target.classList.add('is-visible');  // CSS animates opacity + position
          observer.unobserve(entry.target);          // reveal once, then stop watching
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' } // 12% visible, and 40px inside the bottom edge
  );

  items.forEach((el) => observer.observe(el));
}


/* --------------------------------------------------------------------------
   6. SCALLOPED BADGES (wavy edge)
   A badge is a plain circle in CSS. Here we compute a polygon with many tiny
   points alternating between an outer and an inner radius, which makes a
   wavy "stamp" edge, then apply it with clip-path.
   Math reminder: x = centre + radius * cos(angle), y = centre + radius * sin(angle).
   If JavaScript fails, the badge simply stays a clean circle.
   -------------------------------------------------------------------------- */
function scallopedPolygon(bumps = 36, outer = 50, inner = 46.5) {
  const points = [];
  for (let i = 0; i < bumps * 2; i++) {
    const radius = i % 2 === 0 ? outer : inner;      // even points = tip, odd points = dip
    const angle = (Math.PI * i) / bumps;             // spread points evenly around the circle
    const x = 50 + radius * Math.cos(angle);         // 50 = centre, in percent
    const y = 50 + radius * Math.sin(angle);
    points.push(`${x.toFixed(2)}% ${y.toFixed(2)}%`);
  }
  return `polygon(${points.join(', ')})`;
}

function initScallops() {
  const shape = scallopedPolygon();
  document.querySelectorAll('[data-scallop]').forEach((el) => {
    el.style.clipPath = shape;
  });
}


/* --------------------------------------------------------------------------
   7. IMAGE FALLBACKS (missing portrait / project images)
   If an <img> with data-fallback fails to load (file not added yet, wrong name),
   we swap in a neat placeholder drawn as an inline SVG, so the layout never breaks.
   Once you add the real files, the real images show automatically.
   -------------------------------------------------------------------------- */
function makePlaceholder(label, type) {
  let svg;
  if (type === 'portrait') {
    // A simple blue silhouette on a transparent background
    svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1100" viewBox="0 0 800 1100">
      <circle cx="400" cy="340" r="150" fill="#C7D7F5"/>
      <path d="M80 1100C80 760 230 600 400 600S720 760 720 1100Z" fill="#C7D7F5"/>
      <text x="400" y="900" fill="#2F5BFF" font-family="Arial,sans-serif" font-size="40" text-anchor="middle">${label}</text>
    </svg>`;
  } else {
    // A blue gradient card with the project name
    svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="750" viewBox="0 0 1200 750">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2F5BFF"/><stop offset="1" stop-color="#0E1631"/></linearGradient></defs>
      <rect width="1200" height="750" fill="url(#g)"/>
      <text x="600" y="375" fill="#ffffff" font-family="Arial,sans-serif" font-size="56" text-anchor="middle" dominant-baseline="middle">${label}</text>
      <text x="600" y="450" fill="#C7D7F5" font-family="Arial,sans-serif" font-size="28" text-anchor="middle">Replace this image in /assets</text>
    </svg>`;
  }
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

function initImageFallbacks() {
  document.querySelectorAll('img[data-fallback]').forEach((img) => {
    const applyFallback = () => {
      if (img.dataset.fallbackApplied) return;          // never loop if the fallback itself fails
      img.dataset.fallbackApplied = 'true';
      img.src = makePlaceholder(img.dataset.fallback, img.dataset.fallbackType || 'project');
    };

    // Case A: the image already tried to load and failed before this script ran.
    if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) {
      applyFallback();
    } else {
      // Case B: it has not failed yet, so listen for the failure.
      img.addEventListener('error', applyFallback, { once: true });
    }
  });
}


/* --------------------------------------------------------------------------
   8. PLACEHOLDER LINKS
   Links with href="#" would jump to the top of the page. While you do not have
   real project URLs, we block that jump. Once you put a real URL in the href
   and delete the data-placeholder attribute, the link works normally.
   -------------------------------------------------------------------------- */
function initPlaceholderLinks() {
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[data-placeholder]');
    if (link) event.preventDefault();
  });
}


/* --------------------------------------------------------------------------
   9. CONTACT FORM: validation + demonstration feedback
   Flow:
     submit -> stop the browser's default send -> check every field ->
     if something is wrong: show a message under it and focus the first bad field ->
     if all is OK: demo mode pretends to send, real mode POSTs to your service.
   HONESTY NOTE: with demoMode = true NOTHING is emailed. A website cannot send
   email by itself; it needs a backend or a form service (see the setup guide).
   -------------------------------------------------------------------------- */
function initContactForm() {
  const form = document.getElementById('contact-form');
  const status = document.getElementById('form-status');
  const submitBtn = document.getElementById('submit-btn');
  if (!form || !status || !submitBtn) return;

  // A simple email check: something@something.something (no spaces)
  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  // One rule per field. Each rule returns an error message, or '' when the value is fine.
  const rules = {
    'field-name': (v) => (v.trim().length < 2 ? 'Please enter your name (at least 2 characters).' : ''),
    'field-email': (v) => {
      if (!v.trim()) return 'Please enter your email address.';
      return EMAIL_PATTERN.test(v.trim()) ? '' : 'Please enter a valid email address, like name@example.com.';
    },
    'field-service': (v) => (!v ? 'Please choose a service.' : ''),
    'field-message': (v) => (v.trim().length < 10 ? 'Please write at least 10 characters about your project.' : '')
  };

  // Check ONE field and show/hide its error. Returns true if the field is valid.
  function validateField(id) {
    const input = document.getElementById(id);
    const errorEl = document.getElementById(id + '-error');
    if (!input || !errorEl) return true;

    const message = rules[id](input.value);
    errorEl.textContent = message;                                  // empty text hides it (see :empty in CSS)
    input.setAttribute('aria-invalid', message ? 'true' : 'false'); // red border + screen reader info
    return message === '';
  }

  function showStatus(type, text) {
    status.hidden = false;
    status.className = 'form-status form-status--' + type;
    status.textContent = text;
  }

  // Live feedback: validate when the visitor leaves a field, and clear errors as they fix it.
  Object.keys(rules).forEach((id) => {
    const input = document.getElementById(id);
    if (!input) return;
    input.addEventListener('blur', () => validateField(id));
    input.addEventListener('input', () => {
      if (input.getAttribute('aria-invalid') === 'true') validateField(id);
    });
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault(); // stop the browser from reloading the page
    status.hidden = true;

    // Validate EVERY field (don't stop at the first error, so all problems show at once).
    const results = Object.keys(rules).map((id) => ({ id, ok: validateField(id) }));
    const firstBad = results.find((r) => !r.ok);
    if (firstBad) {
      document.getElementById(firstBad.id).focus();
      showStatus('error', 'Please fix the highlighted fields and try again.');
      return;
    }

    // Lock the button so it can't be clicked twice.
    const originalLabel = submitBtn.firstChild.textContent;
    submitBtn.disabled = true;
    submitBtn.firstChild.textContent = 'Sending… ';

    try {
      if (SETTINGS.demoMode) {
        // Pretend to send. The 700 ms wait just makes the button state visible.
        await new Promise((resolve) => setTimeout(resolve, 700));
        showStatus('success', SETTINGS.demoSuccessMessage);
      } else {
        // Real sending: POST the form data to your form service.
        const response = await fetch(SETTINGS.formEndpoint, {
          method: 'POST',
          body: new FormData(form),                  // collects every field that has a name=""
          headers: { Accept: 'application/json' }
        });
        if (!response.ok) throw new Error('Server answered with status ' + response.status);
        showStatus('success', SETTINGS.realSuccessMessage);
      }
      form.reset();
      // reset() clears the values, so also clear any leftover red borders.
      Object.keys(rules).forEach((id) => document.getElementById(id).setAttribute('aria-invalid', 'false'));
    } catch (error) {
      console.error('Form error:', error);
      showStatus('error', SETTINGS.errorMessage);
    } finally {
      submitBtn.disabled = false;
      submitBtn.firstChild.textContent = originalLabel;
    }
  });
}

/* --------------------------------------------------------------------------
   HAND-DRAWN COILS (the loops beside the "I'm ready to talk" badge)
   Idea: a point travels in a straight line while ALSO circling around it.
   Travelling + circling together draws a coil (a "prolate trochoid").
     x = step * t / (2π) − along  * sin(t)     (t = angle in radians)
     y =               − across * cos(t)
   "fade" shrinks the circling to 0 at both ends, so the line starts and
   ends as a gentle tail instead of a sudden loop. Then we rotate the shape,
   scale it to fit the SVG's viewBox, and join the points with smooth curves.
   -------------------------------------------------------------------------- */
function coilPath(opts, width, height) {
  const { loops = 3, step = 30, along = 13, across = 38, angle = -25, samples = 20, pad = 3 } = opts;

  const ramp = Math.PI * 1.2;                         // how long the tails are
  const total = loops * 2 * Math.PI + 2 * ramp;       // total angle to draw
  const count = Math.ceil((total / (2 * Math.PI)) * samples); // number of points
  const rad = (angle * Math.PI) / 180;                // degrees -> radians
  const ease = (t) => Math.sin(Math.min(Math.max(t, 0), 1) * Math.PI / 2); // smooth 0 -> 1

  // 1. Calculate the points
  const pts = [];
  for (let i = 0; i <= count; i++) {
    const t = (total * i) / count;
    const fade = ease(t / ramp) * ease((total - t) / ramp); // 0 at both ends, 1 in the middle
    const x = (step * t) / (2 * Math.PI) - along * fade * Math.sin(t);
    const y = -across * fade * Math.cos(t);
    // rotate the whole coil by "angle"
    pts.push([x * Math.cos(rad) - y * Math.sin(rad), x * Math.sin(rad) + y * Math.cos(rad)]);
  }

  // 2. Scale and centre the coil so it fits inside the SVG viewBox
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const scale = Math.min((width - 2 * pad) / (maxX - minX), (height - 2 * pad) / (maxY - minY));
  const offX = (width - (maxX - minX) * scale) / 2 - minX * scale;
  const offY = (height - (maxY - minY) * scale) / 2 - minY * scale;
  const P = pts.map(([x, y]) => [x * scale + offX, y * scale + offY]);

  // 3. Join the points with smooth curves (Catmull-Rom converted to Bezier "C" commands)
  const f = (n) => n.toFixed(1);
  let d = `M${f(P[0][0])} ${f(P[0][1])}`;
  for (let i = 0; i < P.length - 1; i++) {
    const p0 = P[i - 1] || P[i], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2] || P[i + 1];
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ` +
         `${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ` +
         `${f(p2[0])} ${f(p2[1])}`;
  }
  return d;
}

// Finds every <path data-coil='...'> and writes its "d" attribute from the settings.
function initCoils() {
  document.querySelectorAll('path[data-coil]').forEach((path) => {
    try {
      const box = path.ownerSVGElement.viewBox.baseVal;     // the SVG's viewBox size
      const options = JSON.parse(path.dataset.coil);        // the settings from the HTML
      path.setAttribute('d', coilPath(options, box.width, box.height));
    } catch (error) {
      console.warn('Coil settings are invalid, using the fallback path.', error);
    }
  });
}


/* MOBILE FIX #11: Move contact details below the form on phones.
   On desktop, restore them to their original position. */
function positionContactDetails() {
  const details = document.querySelector('.contact__details');
  const intro = document.querySelector('.contact__intro');
  const introText = document.querySelector('.contact__text');
  const form = document.getElementById('contact-form');
  const formStatus = document.getElementById('form-status');

  // Stop safely if any required element is missing.
  if (!details || !introText || !form || !formStatus) return;

  if (window.matchMedia('(max-width: 767px)').matches) {
    // Place email and location after the Send Message button/status.
    formStatus.after(details);
  } else {
    // Restore the original desktop position, below the intro paragraph.
    introText.after(details);
  }
}

// Apply the correct layout when the page loads and when its size changes.
positionContactDetails();
window.addEventListener('resize', positionContactDetails);


/* --------------------------------------------------------------------------
   10. START EVERYTHING
   The script is loaded with "defer", so the HTML is already parsed here.
   -------------------------------------------------------------------------- */
initYear();
initHeader();
initMobileMenu();
initActiveNav();
initReveal();
initScallops();
initCoils();
initImageFallbacks();
initPlaceholderLinks();
initContactForm();