import { useEffect, useMemo, useState } from 'react';

import publicApi from '../../../services/public/publicApi';
import '../../../styles/PrivacyPolicyPage.css';

function toSlug(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizePrivacyItem(item, index) {
  if (!item || typeof item !== 'object') return null;

  const title = String(item.privacyName || item.title || '').trim() || `Policy ${index + 1}`;
  const content = String(item.privacyContent || item.content || '').trim();
  const id = String(item._id || item.id || `policy-${index + 1}`);
  const anchor = `${toSlug(title) || 'policy'}-${index + 1}`;

  return {
    id,
    title,
    content,
    updatedAt: item.updatedAt || item.createdAt || null,
    anchor,
  };
}

function sectionIcon(title) {
  const key = String(title || '').toLowerCase();

  if (key.includes('cookie')) return 'cookie';
  if (key.includes('refund')) return 'paid';
  if (key.includes('term')) return 'gavel';
  if (key.includes('content')) return 'description';
  if (key.includes('privacy')) return 'shield';

  return 'policy';
}

export default function PolicyPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);
  const [activeAnchor, setActiveAnchor] = useState('');
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError('');

      try {
        const data = await publicApi.getPrivacies();
        const list = Array.isArray(data?.items) ? data.items : [];
        const normalized = list.map(normalizePrivacyItem).filter(Boolean);

        if (!active) return;

        setItems(normalized);
        setActiveAnchor(normalized[0]?.anchor || '');
      } catch (e) {
        if (!active) return;
        setItems([]);
        setError(e?.response?.data?.message || e?.message || 'Failed to load policy data.');
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!items.length || typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') return undefined;

    const elements = items.map((item) => document.getElementById(item.anchor)).filter(Boolean);
    if (!elements.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const inView = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (inView[0]?.target?.id) setActiveAnchor(inView[0].target.id);
      },
      {
        rootMargin: '-40% 0px -45% 0px',
        threshold: [0.1, 0.3, 0.6],
      }
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, [items]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const onScroll = () => setShowBackToTop(window.scrollY > 480);

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const lastUpdated = useMemo(() => {
    const timestamps = items
      .map((item) => new Date(item.updatedAt || '').getTime())
      .filter((value) => Number.isFinite(value));

    if (!timestamps.length) return '';

    const latest = Math.max(...timestamps);
    return new Date(latest).toLocaleString();
  }, [items]);

  const goToSection = (anchor) => {
    setActiveAnchor(anchor);

    const section = document.getElementById(anchor);
    if (!section) return;

    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="privacy-page">
      <div className="privacy-header">
        <h1 className="privacy-title">System Policy</h1>
        <p className="privacy-meta">{lastUpdated ? `Last updated: ${lastUpdated}` : 'Terms and rules for using the platform.'}</p>
      </div>

      {loading ? (
        <div className="privacy-container">
          <div className="privacy-content">
            <p className="privacy-section-content">Loading policy data...</p>
          </div>
        </div>
      ) : null}

      {!loading && error ? (
        <div className="privacy-container">
          <div className="privacy-content">
            <p className="privacy-section-content">{error}</p>
          </div>
        </div>
      ) : null}

      {!loading && !error && items.length === 0 ? (
        <div className="privacy-container">
          <div className="privacy-content">
            <p className="privacy-section-content">No policy data is available yet.</p>
          </div>
        </div>
      ) : null}

      {!loading && !error && items.length > 0 ? (
        <div className="privacy-container">
          <div className="privacy-mobile-nav">
            <select className="privacy-mobile-select" value={activeAnchor} onChange={(e) => goToSection(e.target.value)}>
              {items.map((item) => (
                <option key={item.id} value={item.anchor}>
                  {item.title}
                </option>
              ))}
            </select>
          </div>

          <aside className="privacy-sidebar" aria-label="Policy navigation">
            <div className="privacy-sidebar-sticky">
              <div className="privacy-sidebar-title">Table of Contents</div>
              <ul className="privacy-nav-list">
                {items.map((item) => {
                  const activeClass = activeAnchor === item.anchor ? 'active' : '';

                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        className={`privacy-nav-link ${activeClass}`}
                        onClick={() => goToSection(item.anchor)}
                      >
                        <span className="material-symbols-outlined">{sectionIcon(item.title)}</span>
                        <span>{item.title}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </aside>

          <article className="privacy-content">
            {items.map((item) => (
              <section key={item.id} id={item.anchor} className="privacy-section">
                <h2 className="privacy-section-title">
                  <span className="material-symbols-outlined privacy-section-icon">{sectionIcon(item.title)}</span>
                  {item.title}
                </h2>

                <div className="privacy-section-content">
                  <p style={{ whiteSpace: 'pre-line' }}>{item.content || 'This section is being updated.'}</p>
                </div>
              </section>
            ))}

            <div className="privacy-footer">
              <p className="privacy-footer-text">Need help with policy or legal questions?</p>
              <a className="privacy-contact-link" href="mailto:support@sansieutoc.vn">
                support@sansieutoc.vn
              </a>
            </div>
          </article>
        </div>
      ) : null}

      <button
        type="button"
        aria-label="Back to top"
        className={`privacy-back-to-top ${showBackToTop ? 'visible' : ''}`}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        <span className="material-symbols-outlined">arrow_upward</span>
      </button>
    </div>
  );
}
