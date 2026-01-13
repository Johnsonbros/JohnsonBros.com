export const BOOKING_CONFIRMATION_WIDGET = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: transparent;
      color: #1a1a1a;
      padding: 16px;
    }
    .card {
      background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
      border: 1px solid #22c55e;
      border-radius: 12px;
      padding: 20px;
      max-width: 400px;
    }
    .header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }
    .check-icon {
      width: 40px;
      height: 40px;
      background: #22c55e;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .check-icon svg { width: 24px; height: 24px; stroke: white; }
    .title { font-size: 18px; font-weight: 600; color: #15803d; }
    .subtitle { font-size: 14px; color: #166534; }
    .details { margin-top: 16px; }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #bbf7d0;
    }
    .detail-row:last-child { border-bottom: none; }
    .label { color: #166534; font-size: 14px; }
    .value { font-weight: 500; font-size: 14px; color: #15803d; }
    .confirmation-number {
      background: #22c55e;
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      margin-top: 16px;
      text-align: center;
    }
    .conf-label { font-size: 12px; opacity: 0.9; }
    .conf-value { font-size: 18px; font-weight: 700; letter-spacing: 1px; }
    .footer {
      margin-top: 16px;
      padding-top: 12px;
      border-top: 1px solid #bbf7d0;
      font-size: 13px;
      color: #166534;
    }
    .phone-link {
      color: #15803d;
      font-weight: 600;
      text-decoration: none;
    }
    .trust-strip {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 12px;
    }
    .trust-pill {
      background: #ecfdf5;
      color: #047857;
      border: 1px solid #a7f3d0;
      border-radius: 999px;
      padding: 4px 10px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.2px;
    }
  </style>
</head>
<body>
  <div class="card" id="widget-root"></div>
  <script>
    (function() {
      const data = window.openai?.toolOutput || {};
      const meta = window.openai?.toolResponseMetadata || {};
      const root = document.getElementById('widget-root');
      
      const customer = data.customer_name || 'Customer';
      const scheduled = data.scheduled_time || 'To be confirmed';
      const address = data.address || 'Address on file';
      const service = data.service_description || 'Plumbing service';
      const jobId = data.job_id || data.confirmation_number || 'PENDING';
      const phone = '(617) 479-9911';
      
      root.innerHTML = \`
        <div class="header">
          <div class="check-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div>
            <div class="title">Appointment Confirmed!</div>
            <div class="subtitle">Johnson Bros. Plumbing</div>
          </div>
        </div>
        <div class="details">
          <div class="detail-row">
            <span class="label">Customer</span>
            <span class="value">\${customer}</span>
          </div>
          <div class="detail-row">
            <span class="label">When</span>
            <span class="value">\${scheduled}</span>
          </div>
          <div class="detail-row">
            <span class="label">Service</span>
            <span class="value">\${service}</span>
          </div>
          <div class="detail-row">
            <span class="label">Location</span>
            <span class="value">\${address}</span>
          </div>
        </div>
        <div class="confirmation-number">
          <div class="conf-label">Confirmation Number</div>
          <div class="conf-value">\${jobId}</div>
        </div>
        <div class="trust-strip">
          <span class="trust-pill">Licensed & Insured</span>
          <span class="trust-pill">Same-day availability</span>
          <span class="trust-pill">4.9★ Google Reviews</span>
        </div>
        <div class="footer">
          Need to reschedule? Call us at <a href="tel:+16174799911" class="phone-link">\${phone}</a>
        </div>
      \`;
      
      if (window.openai?.notifyIntrinsicHeight) {
        setTimeout(() => window.openai.notifyIntrinsicHeight(root.offsetHeight + 32), 50);
      }
    })();
  </script>
</body>
</html>
`;

export const AVAILABILITY_WIDGET = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: transparent;
      color: #1a1a1a;
      padding: 16px;
    }
    .card {
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 20px;
      max-width: 450px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }
    .calendar-icon {
      width: 40px;
      height: 40px;
      background: #3b82f6;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .calendar-icon svg { width: 24px; height: 24px; fill: white; }
    .title { font-size: 18px; font-weight: 600; color: #1f2937; }
    .subtitle { font-size: 14px; color: #6b7280; }
    .slots-container { margin-top: 12px; }
    .day-group { margin-bottom: 16px; }
    .day-label {
      font-size: 13px;
      font-weight: 600;
      color: #374151;
      margin-bottom: 8px;
      padding-bottom: 4px;
      border-bottom: 1px solid #e5e7eb;
    }
    .slots-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: 8px;
    }
    .slot {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 8px;
      padding: 10px 12px;
      text-align: center;
      cursor: pointer;
      transition: all 0.15s;
    }
    .slot:hover {
      background: #dbeafe;
      border-color: #3b82f6;
    }
    .slot.selected {
      background: #3b82f6;
      border-color: #3b82f6;
      color: white;
    }
    .slot-time { font-size: 14px; font-weight: 500; }
    .slot-label { font-size: 11px; opacity: 0.8; margin-top: 2px; }
    .no-slots {
      text-align: center;
      color: #6b7280;
      padding: 20px;
      font-style: italic;
    }
    .action-btn {
      width: 100%;
      margin-top: 16px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 8px;
      padding: 12px 16px;
      font-size: 15px;
      font-weight: 500;
      cursor: pointer;
    }
    .action-btn:hover { background: #2563eb; }
    .action-btn:disabled { background: #9ca3af; cursor: not-allowed; }
    .trust-strip {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 16px;
    }
    .trust-pill {
      background: #eff6ff;
      color: #1d4ed8;
      border: 1px solid #bfdbfe;
      border-radius: 999px;
      padding: 4px 10px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.2px;
    }
  </style>
</head>
<body>
  <div class="card" id="widget-root"></div>
  <script>
    (function() {
      const data = window.openai?.toolOutput || {};
      const root = document.getElementById('widget-root');
      
      const slots = data.available_slots || data.windows || [];
      const serviceType = data.service_type || 'Plumbing Service';
      
      function formatTime(iso) {
        const d = new Date(iso);
        return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      }
      
      function formatDate(iso) {
        const d = new Date(iso);
        return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      }
      
      const groupedSlots = {};
      slots.filter(s => s.available !== false).forEach(slot => {
        const day = formatDate(slot.start_time);
        if (!groupedSlots[day]) groupedSlots[day] = [];
        groupedSlots[day].push(slot);
      });
      
      let slotsHtml = '';
      const days = Object.keys(groupedSlots);
      
      if (days.length === 0) {
        slotsHtml = '<div class="no-slots">No available slots found for the requested dates.</div>';
      } else {
        days.slice(0, 5).forEach(day => {
          const daySlots = groupedSlots[day].slice(0, 6);
          slotsHtml += '<div class="day-group">';
          slotsHtml += '<div class="day-label">' + day + '</div>';
          slotsHtml += '<div class="slots-grid">';
          daySlots.forEach((slot, i) => {
            const time = formatTime(slot.start_time);
            slotsHtml += '<div class="slot" data-slot="' + i + '">';
            slotsHtml += '<div class="slot-time">' + time + '</div>';
            slotsHtml += '</div>';
          });
          slotsHtml += '</div></div>';
        });
      }
      
      root.innerHTML = \`
        <div class="header">
          <div class="calendar-icon">
            <svg viewBox="0 0 24 24"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11zM9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z"/></svg>
          </div>
          <div>
            <div class="title">Available Appointments</div>
            <div class="subtitle">\${serviceType}</div>
          </div>
        </div>
        <div class="slots-container">\${slotsHtml}</div>
        <div class="trust-strip">
          <span class="trust-pill">Live availability</span>
          <span class="trust-pill">24/7 emergency</span>
          <span class="trust-pill">South Shore experts</span>
        </div>
      \`;
      
      if (window.openai?.notifyIntrinsicHeight) {
        setTimeout(() => window.openai.notifyIntrinsicHeight(root.offsetHeight + 32), 50);
      }
    })();
  </script>
</body>
</html>
`;

export const SERVICES_WIDGET = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: transparent;
      color: #1a1a1a;
      padding: 16px;
    }
    .card {
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 20px;
      max-width: 500px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid #e5e7eb;
    }
    .wrench-icon {
      width: 40px;
      height: 40px;
      background: #f59e0b;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .wrench-icon svg { width: 24px; height: 24px; fill: white; }
    .title { font-size: 18px; font-weight: 600; color: #1f2937; }
    .subtitle { font-size: 14px; color: #6b7280; }
    .services-list { margin-top: 8px; }
    .service-item {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 12px 0;
      border-bottom: 1px solid #f3f4f6;
    }
    .service-item:last-child { border-bottom: none; }
    .service-info { flex: 1; }
    .service-name { font-weight: 500; color: #1f2937; font-size: 15px; }
    .service-desc { font-size: 13px; color: #6b7280; margin-top: 2px; }
    .service-price {
      text-align: right;
      min-width: 100px;
    }
    .price-range { font-weight: 600; color: #059669; font-size: 14px; }
    .duration { font-size: 12px; color: #9ca3af; }
    .emergency-badge {
      display: inline-block;
      background: #fef2f2;
      color: #dc2626;
      font-size: 11px;
      font-weight: 500;
      padding: 2px 6px;
      border-radius: 4px;
      margin-left: 8px;
    }
    .footer {
      margin-top: 16px;
      padding-top: 12px;
      border-top: 1px solid #e5e7eb;
      font-size: 13px;
      color: #6b7280;
      text-align: center;
    }
    .trust-strip {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 12px;
      justify-content: center;
    }
    .trust-pill {
      background: #fff7ed;
      color: #b45309;
      border: 1px solid #fed7aa;
      border-radius: 999px;
      padding: 4px 10px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.2px;
    }
  </style>
</head>
<body>
  <div class="card" id="widget-root"></div>
  <script>
    (function() {
      const data = window.openai?.toolOutput || {};
      const root = document.getElementById('widget-root');
      
      const services = data.services || [];
      const businessName = data.business?.name || 'Johnson Bros. Plumbing';
      
      let servicesHtml = '';
      services.slice(0, 8).forEach(svc => {
        const priceMin = svc.priceRange?.min || svc.price_min || 0;
        const priceMax = svc.priceRange?.max || svc.price_max || 0;
        const priceStr = priceMin === priceMax ? '$' + priceMin : '$' + priceMin + ' - $' + priceMax;
        const emergency = svc.isEmergency ? '<span class="emergency-badge">24/7</span>' : '';
        
        servicesHtml += \`
          <div class="service-item">
            <div class="service-info">
              <div class="service-name">\${svc.name || svc.title}\${emergency}</div>
              <div class="service-desc">\${svc.description || ''}</div>
            </div>
            <div class="service-price">
              <div class="price-range">\${priceStr}</div>
              <div class="duration">\${svc.estimatedDuration || svc.duration || ''}</div>
            </div>
          </div>
        \`;
      });
      
      root.innerHTML = \`
        <div class="header">
          <div class="wrench-icon">
            <svg viewBox="0 0 24 24"><path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/></svg>
          </div>
          <div>
            <div class="title">Our Services</div>
            <div class="subtitle">\${businessName}</div>
          </div>
        </div>
        <div class="services-list">\${servicesHtml}</div>
        <div class="trust-strip">
          <span class="trust-pill">Licensed & Insured</span>
          <span class="trust-pill">15+ years local</span>
          <span class="trust-pill">Same-day options</span>
        </div>
        <div class="footer">$99 service call fee waived when we do the work</div>
      \`;
      
      if (window.openai?.notifyIntrinsicHeight) {
        setTimeout(() => window.openai.notifyIntrinsicHeight(root.offsetHeight + 32), 50);
      }
    })();
  </script>
</body>
</html>
`;

export const QUOTE_WIDGET = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: transparent;
      color: #1a1a1a;
      padding: 16px;
    }
    .card {
      background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
      border: 1px solid #3b82f6;
      border-radius: 12px;
      padding: 20px;
      max-width: 400px;
    }
    .header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }
    .dollar-icon {
      width: 40px;
      height: 40px;
      background: #3b82f6;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      font-weight: bold;
      color: white;
    }
    .title { font-size: 18px; font-weight: 600; color: #1e40af; }
    .subtitle { font-size: 14px; color: #3b82f6; }
    .estimate-box {
      background: white;
      border-radius: 10px;
      padding: 16px;
      margin-top: 12px;
      text-align: center;
    }
    .estimate-label { font-size: 13px; color: #6b7280; margin-bottom: 4px; }
    .estimate-range { font-size: 28px; font-weight: 700; color: #1e40af; }
    .estimate-note { font-size: 12px; color: #9ca3af; margin-top: 4px; }
    .details { margin-top: 16px; }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #bfdbfe;
    }
    .detail-row:last-child { border-bottom: none; }
    .label { color: #3b82f6; font-size: 14px; }
    .value { font-weight: 500; font-size: 14px; color: #1e40af; }
    .urgency-badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
    }
    .urgency-routine { background: #dcfce7; color: #166534; }
    .urgency-soon { background: #fef3c7; color: #92400e; }
    .urgency-urgent { background: #fee2e2; color: #991b1b; }
    .urgency-emergency { background: #dc2626; color: white; }
    .cta {
      margin-top: 16px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 8px;
      padding: 12px 16px;
      font-size: 15px;
      font-weight: 500;
      cursor: pointer;
      width: 100%;
      text-align: center;
    }
    .cta:hover { background: #2563eb; }
    .trust-strip {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 12px;
    }
    .trust-pill {
      background: #e0f2fe;
      color: #1e40af;
      border: 1px solid #bfdbfe;
      border-radius: 999px;
      padding: 4px 10px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.2px;
    }
  </style>
</head>
<body>
  <div class="card" id="widget-root"></div>
  <script>
    (function() {
      const data = window.openai?.toolOutput || {};
      const root = document.getElementById('widget-root');
      
      const service = data.service_type || data.service || 'Plumbing Service';
      const priceMin = data.price_range?.min || data.estimate_min || 99;
      const priceMax = data.price_range?.max || data.estimate_max || 500;
      const duration = data.estimated_duration || data.duration || '1-3 hours';
      const urgency = data.urgency || 'routine';
      
      const urgencyLabels = {
        routine: 'Routine',
        soon: 'Soon',
        urgent: 'Urgent',
        emergency: 'Emergency'
      };
      
      root.innerHTML = \`
        <div class="header">
          <div class="dollar-icon">$</div>
          <div>
            <div class="title">Instant Estimate</div>
            <div class="subtitle">\${service}</div>
          </div>
        </div>
        <div class="estimate-box">
          <div class="estimate-label">Estimated Cost Range</div>
          <div class="estimate-range">$\${priceMin} - $\${priceMax}</div>
          <div class="estimate-note">Final price depends on specific work needed</div>
        </div>
        <div class="details">
          <div class="detail-row">
            <span class="label">Service</span>
            <span class="value">\${service}</span>
          </div>
          <div class="detail-row">
            <span class="label">Est. Duration</span>
            <span class="value">\${duration}</span>
          </div>
          <div class="detail-row">
            <span class="label">Priority</span>
            <span class="value"><span class="urgency-badge urgency-\${urgency}">\${urgencyLabels[urgency] || urgency}</span></span>
          </div>
          <div class="detail-row">
            <span class="label">Service Call</span>
            <span class="value">$99 (waived if we do the work)</span>
          </div>
        </div>
        <div class="trust-strip">
          <span class="trust-pill">Transparent pricing</span>
          <span class="trust-pill">Licensed & insured</span>
          <span class="trust-pill">Rated 4.9★</span>
        </div>
      \`;
      
      if (window.openai?.notifyIntrinsicHeight) {
        setTimeout(() => window.openai.notifyIntrinsicHeight(root.offsetHeight + 32), 50);
      }
    })();
  </script>
</body>
</html>
`;

export const EMERGENCY_WIDGET = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: transparent;
      color: #1a1a1a;
      padding: 16px;
    }
    .card {
      background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
      border: 2px solid #dc2626;
      border-radius: 12px;
      padding: 20px;
      max-width: 450px;
    }
    .header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }
    .alert-icon {
      width: 44px;
      height: 44px;
      background: #dc2626;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
    .alert-icon svg { width: 28px; height: 28px; fill: white; }
    .title { font-size: 20px; font-weight: 700; color: #991b1b; }
    .subtitle { font-size: 14px; color: #dc2626; }
    .urgency-critical { background: #dc2626; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; }
    .steps-section { margin-top: 16px; }
    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: #991b1b;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .steps-list { list-style: none; }
    .steps-list li {
      position: relative;
      padding: 8px 0 8px 24px;
      font-size: 14px;
      color: #7f1d1d;
      border-bottom: 1px solid #fecaca;
    }
    .steps-list li:last-child { border-bottom: none; }
    .steps-list li::before {
      content: '';
      position: absolute;
      left: 0;
      top: 12px;
      width: 8px;
      height: 8px;
      background: #dc2626;
      border-radius: 50%;
    }
    .dont-list li::before { background: #f97316; }
    .call-action {
      margin-top: 16px;
      background: #dc2626;
      color: white;
      border: none;
      border-radius: 8px;
      padding: 14px 16px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      width: 100%;
      text-align: center;
      text-decoration: none;
      display: block;
    }
    .call-action:hover { background: #b91c1c; }
    .call-note {
      text-align: center;
      font-size: 12px;
      color: #991b1b;
      margin-top: 8px;
    }
    .trust-strip {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 12px;
      justify-content: center;
    }
    .trust-pill {
      background: #fee2e2;
      color: #991b1b;
      border: 1px solid #fecaca;
      border-radius: 999px;
      padding: 4px 10px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.2px;
    }
  </style>
</head>
<body>
  <div class="card" id="widget-root"></div>
  <script>
    (function() {
      const data = window.openai?.toolOutput || {};
      const root = document.getElementById('widget-root');
      
      const title = data.title || 'Emergency Guidance';
      const urgency = data.urgency || 'critical';
      const steps = data.immediateSteps || data.steps || [];
      const dontDo = data.doNotDo || [];
      const phone = '(617) 479-9911';
      
      let stepsHtml = '';
      steps.forEach(step => {
        stepsHtml += '<li>' + step + '</li>';
      });
      
      let dontHtml = '';
      dontDo.forEach(item => {
        dontHtml += '<li>' + item + '</li>';
      });
      
      root.innerHTML = \`
        <div class="header">
          <div class="alert-icon">
            <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
          </div>
          <div>
            <div class="title">\${title}</div>
            <div class="subtitle"><span class="urgency-critical">\${urgency.toUpperCase()}</span></div>
          </div>
        </div>
        <div class="steps-section">
          <div class="section-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#22c55e"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
            Do This Now
          </div>
          <ul class="steps-list">\${stepsHtml}</ul>
        </div>
        \${dontHtml ? \`
        <div class="steps-section">
          <div class="section-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#f97316"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
            Do NOT Do
          </div>
          <ul class="steps-list dont-list">\${dontHtml}</ul>
        </div>
        \` : ''}
        <a href="tel:+16174799911" class="call-action">Call Now: \${phone}</a>
        <div class="call-note">24/7 Emergency Line - We're here to help</div>
        <div class="trust-strip">
          <span class="trust-pill">Rapid response</span>
          <span class="trust-pill">Licensed techs</span>
          <span class="trust-pill">24/7 on-call</span>
        </div>
      \`;
      
      if (window.openai?.notifyIntrinsicHeight) {
        setTimeout(() => window.openai.notifyIntrinsicHeight(root.offsetHeight + 32), 50);
      }
    })();
  </script>
</body>
</html>
`;
