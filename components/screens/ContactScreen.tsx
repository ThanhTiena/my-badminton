import React, { useEffect, useRef, useState } from 'react';
import { Btn, Card, CardTitle } from '@/components/ui';

/* ────────────────────────────────────────────────
   Salesforce Web-to-Lead configuration
   ──────────────────────────────────────────────── */
const SF_ENDPOINT   = 'https://webto.salesforce.com/servlet/servlet.WebToLead?encoding=UTF-8&orgId=00DQE00000Dgv0n';
const SF_ORG_ID     = '00DQE00000Dgv0n';
const RECAPTCHA_KEY = '6LfRMIotAAAAAJ8sTk_NGDtMi5dSs_xmkDDlDdRl';
const CAPTCHA_KEYNAME = 'gas_captcha19082026';
/* Salesforce redirects here after the POST. It targets a hidden iframe, so the
   user never leaves the app — the page just has to exist and be same-origin. */
const RETURN_PATH   = '/lead-thanks.html';

/* Salesforce reads whatever is in this hidden input at submit time, so the
   timestamp is refreshed on a ticker exactly like the generated snippet does. */
const TS_INTERVAL_MS = 500;

declare global {
  interface Window {
    grecaptcha?: {
      render: (el: HTMLElement, opts: { sitekey: string }) => number;
      getResponse: (id?: number) => string;
      reset: (id?: number) => void;
    };
    __sfRecaptchaLoaded?: () => void;
  }
}

interface ContactScreenProps {
  onBack: () => void;
}

export const ContactScreen: React.FC<ContactScreenProps> = ({ onBack }) => {
  const formRef    = useRef<HTMLFormElement>(null);
  const captchaRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLInputElement>(null);
  const widgetId   = useRef<number | null>(null);
  const awaitingResponse = useRef(false);

  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error,  setError]  = useState('');
  const [retURL, setRetURL] = useState('');

  /* retURL must be absolute — resolve it on the client only. */
  useEffect(() => {
    setRetURL(window.location.origin + RETURN_PATH);
  }, []);

  /* ── Load + explicitly render the reCAPTCHA widget ── */
  useEffect(() => {
    const renderWidget = () => {
      if (widgetId.current !== null || !captchaRef.current || !window.grecaptcha?.render) return;
      widgetId.current = window.grecaptcha.render(captchaRef.current, { sitekey: RECAPTCHA_KEY });
    };

    if (window.grecaptcha?.render) {
      renderWidget();
      return;
    }

    window.__sfRecaptchaLoaded = renderWidget;
    if (!document.querySelector('script[data-sf-recaptcha]')) {
      const s = document.createElement('script');
      s.src = 'https://www.google.com/recaptcha/api.js?onload=__sfRecaptchaLoaded&render=explicit';
      s.async = true;
      s.defer = true;
      s.dataset.sfRecaptcha = 'true';
      document.head.appendChild(s);
    }
  }, []);

  /* ── Keep captcha_settings.ts fresh while the captcha is unsolved ── */
  useEffect(() => {
    const tick = () => {
      const response = window.grecaptcha?.getResponse(widgetId.current ?? undefined) ?? '';
      if (response.trim() !== '' || !settingsRef.current) return;
      settingsRef.current.value = JSON.stringify({
        keyname:  CAPTCHA_KEYNAME,
        fallback: 'true',
        orgId:    SF_ORG_ID,
        ts:       JSON.stringify(new Date().getTime()),
      });
    };
    tick();
    const id = setInterval(tick, TS_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const solved = window.grecaptcha?.getResponse(widgetId.current ?? undefined) ?? '';
    if (solved.trim() === '') {
      e.preventDefault();
      setError('Please complete the “I’m not a robot” check first.');
      return;
    }
    setError('');
    setStatus('sending');
    awaitingResponse.current = true;
    // The form posts natively into the hidden iframe below — no fetch (CORS).
  };

  /* The iframe fires load once on mount and again once Salesforce answers. */
  const handleFrameLoad = () => {
    if (!awaitingResponse.current) return;
    awaitingResponse.current = false;
    setStatus('sent');
  };

  const resetForm = () => {
    formRef.current?.reset();
    if (widgetId.current !== null) window.grecaptcha?.reset(widgetId.current);
    setStatus('idle');
    setError('');
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text2)',
  };
  const fieldStyle: React.CSSProperties = { marginBottom: 14 };

  return (
    <div className="anim-fade">
      <button className="back-btn" onClick={onBack}>← Back</button>
      <p className="page-title">✉️ Join the Club</p>
      <p className="page-sub">Leave your details and we&rsquo;ll get back to you about sessions and membership</p>

      <Card style={{ marginTop: 20, maxWidth: 560 }}>
        {status === 'sent' ? (
          <div style={{ textAlign: 'center', padding: '24px 8px' }}>
            <span style={{ fontSize: 44 }}>🎉</span>
            <CardTitle>Thanks — we got it!</CardTitle>
            <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>
              Your details are on their way to us. We&rsquo;ll be in touch soon.
            </p>
            <Btn variant="secondary" onClick={resetForm}>Send another</Btn>
          </div>
        ) : (
          <>
            <CardTitle>Contact us</CardTitle>
            <form
              ref={formRef}
              action={SF_ENDPOINT}
              method="POST"
              target="sf-lead-frame"
              onSubmit={handleSubmit}
            >
              {/* ── Salesforce hidden fields ── */}
              <input ref={settingsRef} type="hidden" name="captcha_settings" defaultValue="" />
              <input type="hidden" name="oid" value={SF_ORG_ID} readOnly />
              <input type="hidden" name="retURL" value={retURL} readOnly />
              <input type="hidden" id="lead_source" name="lead_source" value="Web" readOnly />

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                <div style={fieldStyle}>
                  <label style={labelStyle} htmlFor="first_name">First Name</label>
                  <input className="input" id="first_name" name="first_name" maxLength={40} type="text" autoComplete="given-name" />
                </div>

                <div style={fieldStyle}>
                  <label style={labelStyle} htmlFor="last_name">Last Name *</label>
                  <input className="input" id="last_name" name="last_name" maxLength={80} type="text" required autoComplete="family-name" />
                </div>
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle} htmlFor="email">Email *</label>
                <input className="input" id="email" name="email" maxLength={80} type="email" required autoComplete="email" />
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle} htmlFor="company">Company *</label>
                <input className="input" id="company" name="company" maxLength={40} type="text" required autoComplete="organization" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                <div style={fieldStyle}>
                  <label style={labelStyle} htmlFor="city">City</label>
                  <input className="input" id="city" name="city" maxLength={40} type="text" autoComplete="address-level2" />
                </div>

                <div style={fieldStyle}>
                  <label style={labelStyle} htmlFor="state">State / Province</label>
                  <input className="input" id="state" name="state" maxLength={20} type="text" autoComplete="address-level1" />
                </div>
              </div>

              {/* reCAPTCHA renders into this container */}
              <div ref={captchaRef} style={{ margin: '4px 0 14px' }} />

              {error && (
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--danger, #e5484d)', marginBottom: 12 }} role="alert">
                  {error}
                </p>
              )}

              <Btn variant="primary" full disabled={status === 'sending' || !retURL}>
                {status === 'sending' ? '⏳ Sending…' : '📩 Send'}
              </Btn>
            </form>
          </>
        )}
      </Card>

      {/* Keeps the POST from navigating the app away */}
      <iframe
        name="sf-lead-frame"
        title="Salesforce lead submission"
        onLoad={handleFrameLoad}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default ContactScreen;
