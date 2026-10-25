/* Kisan Store customer enquiry popup. Configure APPS_SCRIPT_URL before launch. */
(() => {
  'use strict';
  const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyv66Z94EiaxqKNQCfIgqQl9tKJNL3SGzcZajDMxkySWaLwJkjN05g-y4qrgot0m2u2/exec';
  const SESSION_KEY = 'kisan-store-enquiry-popup-seen';
  const DELAY_MS = 9000;
  function addPopup() {
    if (document.getElementById('ks-customer-overlay')) return;
    const overlay = document.createElement('div');
    overlay.id = 'ks-customer-overlay'; overlay.hidden = true;
    overlay.innerHTML = `
      <section id="ks-customer-dialog" role="dialog" aria-modal="true" aria-labelledby="ks-popup-title" aria-describedby="ks-popup-description">
        <button class="ks-popup-close" type="button" aria-label="Close form">&times;</button>
        <div class="ks-popup-head"><div class="ks-popup-brand"><span class="ks-popup-mark" aria-hidden="true">KH</span><span><strong>KISAN HARDWARE</strong><small>& SANITARY STORE</small></span></div>
          <h2 id="ks-popup-title">Need help finding the right product?</h2><p class="ks-popup-intro" id="ks-popup-description">Share what you’re looking for. Our store team can help with product availability and enquiries.</p></div>
        <div class="ks-popup-body"><p class="ks-form-status" id="ks-popup-status" role="status" aria-live="polite" hidden></p>
          <form id="ks-customer-form">
            <label class="ks-field"><span>Your name *</span><input name="customerName" autocomplete="name" maxlength="100" required placeholder="Enter your name"></label>
            <label class="ks-field"><span>Mobile number *</span><input name="phone" type="tel" inputmode="tel" autocomplete="tel" maxlength="20" required pattern="[+0-9()\\s-]{8,20}" placeholder="Enter your mobile number"></label>
            <label class="ks-field"><span>Village / locality *</span><input name="locality" autocomplete="address-level2" maxlength="120" required placeholder="Your village or locality"></label>
            <label class="ks-field"><span>Product you need *</span><input name="product" maxlength="250" required placeholder="e.g. PVC pipes, taps, paint, tools"></label>
            <label class="ks-consent"><input type="checkbox" name="enquiryConsent" value="yes" required><span>I agree that Kisan Store may use these details to respond to this enquiry. <a href="privacy.html" target="_blank" rel="noopener">Privacy details</a></span></label>
            <label class="ks-consent"><input type="checkbox" name="marketingConsent" value="yes"><span>Yes, I’d also like to receive occasional offers and store updates by phone or WhatsApp. (Optional)</span></label>
            <label class="ks-honeypot" aria-hidden="true">Leave this field empty<input name="website" tabindex="-1" autocomplete="off"></label>
            <button class="ks-submit" type="submit">Send my enquiry <span aria-hidden="true">→</span></button><p class="ks-popup-footnote">Your details are used to handle your enquiry. Promotional updates are optional and can be declined.</p>
          </form></div></section>`;
    document.body.appendChild(overlay);
    const dialog = overlay.querySelector('#ks-customer-dialog'), closeButton = overlay.querySelector('.ks-popup-close'), form = overlay.querySelector('#ks-customer-form'), status = overlay.querySelector('#ks-popup-status'), submitButton = form.querySelector('button[type="submit"]');
    let previousFocus = null;
    function closePopup() { overlay.hidden = true; document.body.style.overflow = ''; if (previousFocus && previousFocus.focus) previousFocus.focus(); }
    function openPopup() { if (!overlay.hidden) return; previousFocus = document.activeElement; overlay.hidden = false; document.body.style.overflow = 'hidden'; closeButton.focus(); try { sessionStorage.setItem(SESSION_KEY, '1'); } catch (_) {} }
    closeButton.addEventListener('click', closePopup);
    overlay.addEventListener('click', e => { if (e.target === overlay) closePopup(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !overlay.hidden) closePopup(); if (e.key === 'Tab' && !overlay.hidden) { const f = [...dialog.querySelectorAll('button:not(:disabled),input:not(:disabled),a[href]')].filter(x => x.offsetParent !== null); if (!f.length) return; if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length-1].focus(); } else if (!e.shiftKey && document.activeElement === f[f.length-1]) { e.preventDefault(); f[0].focus(); } } });
    form.addEventListener('submit', async e => {
      e.preventDefault(); status.hidden = true;
      if (form.elements.website.value) return;
      if (APPS_SCRIPT_URL.includes('PASTE_YOUR_GOOGLE')) { status.textContent = 'The enquiry form is not connected yet. Please call or WhatsApp the store for now.'; status.className = 'ks-form-status error'; status.hidden = false; return; }
      submitButton.disabled = true; submitButton.textContent = 'Sending…';
      const values = new URLSearchParams();
      ['customerName','phone','locality','product'].forEach(k => values.set(k, form.elements[k].value.trim()));
      values.set('enquiryConsent', form.elements.enquiryConsent.checked ? 'yes' : 'no'); values.set('marketingConsent', form.elements.marketingConsent.checked ? 'yes' : 'no'); values.set('website',''); values.set('pageUrl', location.href);
      try {
        // Google Apps Script responses may not permit CORS. no-cors submits the URL-encoded request but cannot verify server success.
        await fetch(APPS_SCRIPT_URL, { method:'POST', mode:'no-cors', body:values });
        form.reset(); form.hidden = true; status.textContent = 'Thank you! Your enquiry has been sent. We’ll get in touch if needed.'; status.className = 'ks-form-status success'; status.hidden = false; submitButton.textContent = 'Enquiry sent';
      } catch (_) { status.textContent = 'We couldn’t send this right now. Please call or WhatsApp the store at +91 9667540112.'; status.className = 'ks-form-status error'; status.hidden = false; submitButton.disabled = false; submitButton.textContent = 'Try again'; }
    });
    let seen = false; try { seen = sessionStorage.getItem(SESSION_KEY) === '1'; } catch (_) {}
    if (!seen) window.setTimeout(openPopup, DELAY_MS);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addPopup, { once:true }); else addPopup();
})();
