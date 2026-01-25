// JBros Capacity Hero Widget
(function() {
  // Configuration from data attributes
  const script = document.currentScript as HTMLScriptElement;
  const targetSelector = script.dataset.target || '#jbros-hero';
  const apiUrl = script.dataset.api || '/capacity/today';
  const bookUrl = script.dataset.bookUrl || 'https://thejohnsonbros.com/book';
  const refreshInterval = parseInt(script.dataset.refresh || '120') * 1000;

  // Widget styles (embedded to avoid extra CSS file)
  const styles = `
    .jbros-hero {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #0b2a6f 0%, #1a3a8f 100%);
      color: #ffffff;
      padding: 2rem 1.5rem;
      border-radius: 8px;
      text-align: center;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      position: relative;
      overflow: hidden;
    }

    .jbros-hero::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%);
      animation: pulse 4s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 0.5; }
      50% { transform: scale(1.1); opacity: 0.3; }
    }

    .jbros-hero-content {
      position: relative;
      z-index: 1;
    }

    .jbros-hero-badge {
      display: inline-block;
      background: #d32f2f;
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.875rem;
      font-weight: 600;
      margin-bottom: 1rem;
      animation: badge-glow 2s ease-in-out infinite;
    }

    .jbros-hero-badge.urgent {
      animation: urgent-pulse 1.5s ease-in-out infinite;
    }

    @keyframes badge-glow {
      0%, 100% { box-shadow: 0 0 5px rgba(211, 47, 47, 0.5); }
      50% { box-shadow: 0 0 20px rgba(211, 47, 47, 0.8); }
    }

    @keyframes urgent-pulse {
      0%, 100% { 
        transform: scale(1);
        box-shadow: 0 0 5px rgba(211, 47, 47, 0.5);
      }
      50% { 
        transform: scale(1.05);
        box-shadow: 0 0 25px rgba(211, 47, 47, 0.9);
      }
    }

    .jbros-hero-headline {
      font-size: 1.75rem;
      font-weight: 700;
      margin: 0.5rem 0;
      line-height: 1.2;
    }

    .jbros-hero-subhead {
      font-size: 1.125rem;
      margin: 0.5rem 0 1.5rem;
      opacity: 0.95;
      font-weight: 400;
    }

    .jbros-hero-cta {
      display: inline-block;
      background: #ffffff;
      color: #0b2a6f;
      padding: 0.875rem 2rem;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 600;
      font-size: 1.125rem;
      transition: all 0.3s ease;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .jbros-hero-cta:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      background: #f8f8f8;
    }

    .jbros-hero-loading {
      text-align: center;
      padding: 2rem;
      color: #666;
    }

    .jbros-hero-error {
      background: #fee;
      color: #c00;
      padding: 1rem;
      border-radius: 4px;
      text-align: center;
    }

    @media (max-width: 640px) {
      .jbros-hero {
        padding: 1.5rem 1rem;
      }
      .jbros-hero-headline {
        font-size: 1.5rem;
      }
      .jbros-hero-subhead {
        font-size: 1rem;
      }
      .jbros-hero-cta {
        padding: 0.75rem 1.5rem;
        font-size: 1rem;
      }
    }
  `;

  // Create and inject styles
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);

  // Fetch capacity data
  async function fetchCapacity() {
    try {
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error('Failed to fetch capacity');
      return await response.json();
    } catch (error) {
      console.error('JBros Hero Widget: Error fetching capacity', error);
      return null;
    }
  }

  // Render the widget
  function renderWidget(data: any) {
    const target = document.querySelector(targetSelector);
    if (!target) {
      console.error('JBros Hero Widget: Target element not found', targetSelector);
      return;
    }

    if (!data) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'jbros-hero-error';
      errorDiv.textContent = 'Unable to load availability. Please call us at (617) 479-9499.';
      target.replaceChildren(errorDiv);
      return;
    }

    const { overall, ui_copy } = data;
    const isUrgent = ui_copy.urgent || false;
    const badgeClass = isUrgent ? 'jbros-hero-badge urgent' : 'jbros-hero-badge';

    // Build booking URL with promo params if applicable
    let finalBookUrl = bookUrl;
    if (overall.state === 'SAME_DAY_FEE_WAIVED') {
      const separator = bookUrl.includes('?') ? '&' : '?';
      finalBookUrl = `${bookUrl}${separator}promo=FEEWAIVED_SAMEDAY&utm_source=site&utm_campaign=capacity`;
    }

    const heroDiv = document.createElement('div');
    heroDiv.className = 'jbros-hero';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'jbros-hero-content';
    
    if (ui_copy.badge) {
      const badgeDiv = document.createElement('div');
      badgeDiv.className = badgeClass;
      badgeDiv.textContent = ui_copy.badge;
      contentDiv.appendChild(badgeDiv);
    }
    
    const headline = document.createElement('h2');
    headline.className = 'jbros-hero-headline';
    headline.textContent = ui_copy.headline;
    contentDiv.appendChild(headline);
    
    const subhead = document.createElement('p');
    subhead.className = 'jbros-hero-subhead';
    subhead.textContent = ui_copy.subhead;
    contentDiv.appendChild(subhead);
    
    const cta = document.createElement('a');
    cta.className = 'jbros-hero-cta';
    cta.textContent = ui_copy.cta;
    cta.setAttribute('href', finalBookUrl);
    contentDiv.appendChild(cta);
    
    heroDiv.appendChild(contentDiv);
    target.replaceChildren(heroDiv);
  }

  // Initialize and refresh
  async function init() {
    const target = document.querySelector(targetSelector);
    if (target) {
      const loadingDiv = document.createElement('div');
      loadingDiv.className = 'jbros-hero-loading';
      loadingDiv.textContent = 'Checking availability...';
      target.replaceChildren(loadingDiv);
    }

    const data = await fetchCapacity();
    renderWidget(data);
  }

  // Start the widget
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Set up auto-refresh
  if (refreshInterval > 0) {
    setInterval(async () => {
      const data = await fetchCapacity();
      renderWidget(data);
    }, refreshInterval);
  }
})();