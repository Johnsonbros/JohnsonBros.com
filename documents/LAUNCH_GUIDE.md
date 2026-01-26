# Comprehensive Launch Guide & Information Needed

To successfully launch the Johnson Bros. Plumbing & Drain Cleaning AI platform, we need the following information and configurations.

## 1. Required Credentials (API Keys)
Please provide the following keys to enable core features:
- **Google Maps API Key**: Required for the service area map, address autocomplete, and heat maps.
- **Housecall Pro Company API Key**: Required for real-time booking, customer syncing, and job management.
- **Twilio Account SID & Auth Token**: Required for SMS verification and the AI Booking Agent.
- **OpenAI API Key**: Required for the Multi-Hierarchical Agent Swarm (PRIME, ZEKE, JENNY).

## 2. Business Configuration
- **Service Area ZIP Codes**: We need the definitive list of ZIP codes you serve to configure the `config/capacity.yml`.
- **Admin Default Password**: A secure password for the initial setup of the Admin Dashboard.
- **Business Notification Phone**: The phone number where admin alerts (like new booking requests) should be sent.

## 3. Legal & Compliance
- **Privacy Policy**: We need the text for your privacy policy to meet legal requirements for data collection.
- **Terms of Service**: To protect the business during online bookings and membership signups.
- **Cookie Consent**: Guidance on whether you require a strict GDPR-style cookie banner.

## 4. Payment Processing
- **Stripe/Square Key**: For processing the $99/year "Family Discount" membership.

## 5. Domain & Branding
- **Production Domain**: The URL where the site will live (e.g., johnsonbrosplumbing.com).
- **Brand Assets**: High-resolution logo and any specific brand colors (if different from the current blue/white theme).

---

## Technical Progress Update
I have completed the following technical fixes:
- ✅ **API Versioning**: Implemented `/api/v1/` prefixing for better stability.
- ✅ **Mock Data Cleanup**: Disabled fake time slot generation in `MemStorage`.
- ✅ **Security Hardening**: Added rate limiting to sensitive endpoints and ensured proper authentication checks.
- ✅ **Environment Variable Audit**: Identified all missing keys required for launch.
