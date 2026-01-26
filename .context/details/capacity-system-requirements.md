# Capacity System Requirements

**Source:** Owner interview 2026-01-26
**Status:** Requirements gathered, implementation needed

---

## Business Model

### Service Fee Structure
- **$99 service fee** to dispatch a technician
- Technician diagnoses problem on-site, gives estimate
- **If customer accepts estimate**: $99 fee is WAIVED (only pay the quoted work)
- **Fee waiver promotion**: Used as incentive to get quick bookings when capacity allows

### Promotional Logic
| Capacity State | Fee Display | Goal |
|----------------|-------------|------|
| Today + tomorrow have availability | "$99 ~~$99~~ FREE" (slashed) | Encourage immediate booking |
| Today + tomorrow booked out | "$99 service fee - book now" | Standard pricing |

---

## Same-Day Booking Rules

### Cutoff Time: 12:00 PM (Noon) EST
- **Before noon**: Can book same-day slots
- **After noon**: Same-day booking STOPS, next-day booking starts
- **Reason**: Don't want late-day bookings when not planning additional work

### After-Cutoff Banner
> "Same day booking is now closed. Call us directly at (617) 479-9911 to check for last-minute availability."

---

## Weekend / After-Hours Rules

### Friday 5 PM → Monday Morning
- Show "Emergency Only" banner
- BUT still allow booking for Monday/Tuesday if available
- Don't just show emergencies - show next available booking slots

### Emergency Banner
> "Weekend hours - Emergency service only. For emergencies, call us directly. Otherwise, book for Monday."

---

## Holiday Handling
- If today is a holiday: push booking display to next available business day
- Should automatically detect holidays (or use a configured list)

---

## Capacity States (Revised)

| State | Condition | UI Behavior |
|-------|-----------|-------------|
| `SAME_DAY_AVAILABLE` | Before noon + slots today | Show today's slots, "$99 FREE" promo |
| `NEXT_DAY_AVAILABLE` | After noon OR no today slots | Show tomorrow's slots, "$99 FREE" promo |
| `BOOKED_OUT` | Today + tomorrow full | Show next available, standard $99 fee |
| `WEEKEND_EMERGENCY` | Fri 5PM - Mon 8AM | Emergency banner + Monday booking |
| `HOLIDAY` | Holiday detected | Push to next business day |

---

## Website Goals (Priority Order)

1. **CALL or BOOK online** - Primary conversion
2. **Fill out contact form** - Lead capture
3. **Engage with site** - Build trust
4. **Refer people** - Referral program

### Mobile Quick Nav (Bottom Bar)
- Call CTA
- Book CTA
- Contact form CTA
- Referral CTA

---

## Technical Changes Needed

### Backend (capacity.ts)
- [ ] Add weekend detection (Fri 5PM - Mon 8AM)
- [ ] Add holiday detection/configuration
- [ ] Change states from current 4 to new 5-state model
- [ ] Track "booked out" (today + tomorrow full) separately

### Frontend
- [ ] Dynamic banners based on state
- [ ] "$99 FREE" vs "$99" display logic
- [ ] "Call for same-day" messaging after noon
- [ ] Weekend emergency messaging with Monday booking

### Configuration (capacity.yml)
- [ ] Add holiday list
- [ ] Add weekend hours config
- [ ] Add banner copy for each state

---

## Questions Resolved

| Question | Answer |
|----------|--------|
| Same-day cutoff | 12:00 PM (noon) EST |
| EMERGENCY_ONLY trigger | Weekends (Fri 5PM - Mon 8AM) + holidays |
| Tiered pricing | No tiers - $99 fee waived as promo when capacity available |
| Business goal | Get calls/bookings, then contact forms, then engagement, then referrals |
