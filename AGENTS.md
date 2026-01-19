# Johnson Bros. Plumbing & Drain Cleaning: AI Agent Swarm Framework

## **1. Executive Summary**
This document outlines the architectural blueprint for the industry's first "AI-First" Plumbing Business CRM. By moving beyond single-agent "copilots" into a multi-hierarchical swarm of specialized agents, we create a self-healing, autonomous organization capable of strategic planning, operational excellence, and elite field support.

---

## **2. The Hierarchical Swarm Architecture**

### **Tier 1: Strategic Command (PRIME)**
- **Persona**: The Owner's Digital Twin (Co-Founder/CEO).
- **Domain**: Long-horizon strategic planning (6-24 months).
- **Core Goal**: Maximize business growth and profitability while ensuring Nate Johnson maintains full control with minimal manual effort.
- **Capabilities**:
  - Quarterly goal setting and KPI tracking.
  - Final authorization for major expenses or system changes.
  - Strategic briefings delivered to Nate (SMS/Voice).
  - Oversight of the entire agent swarm.

### **Tier 2: Operational Supervision (ZEKE)**
- **Persona**: The AI Chief Operating Officer (COO).
- **Domain**: Mid-horizon operations (1-4 weeks).
- **Core Goal**: Flawless day-to-day business execution.
- **Capabilities**:
  - Dispatching and schedule optimization via Housecall Pro.
  - Escalation routing (Human vs. AI resolution).
  - GitHub "Auto-Fix" management for technical stability.
  - Managing specialized operations agents (Marketing, Data, Order Mgmt).

### **Tier 3: Specialized Operations (The Admin Swarm)**
These agents report to ZEKE and handle deep-domain tasks:
- **MARKETING Agent**: SEO management, campaign analysis, and lead generation.
- **DATA PROCESSING Agent**: Real-time revenue analytics and automated reporting.
- **ORDER MGMT Agent**: Inventory monitoring and automated parts ordering.

### **Tier 4: Frontline Interaction (JENNY)**
- **Persona**: The Expert Secretary.
- **Domain**: Immediate customer interactions (Real-time).
- **Core Goal**: Professional booking and elite customer service.
- **Capabilities**:
  - Web Chat, Voice, and SMS booking.
  - Instant pricing quotes and FAQ resolution.
  - SMS identity verification.

### **Tier 5: Field Operations (Technician Copilots)**
- **Persona**: The Master Plumber's Apprentice.
- **Domain**: Jobsite-specific assistance (Live Job).
- **Core Goal**: Ensure technician safety, accuracy, and data capture.
- **Capabilities**:
  - Voice-activated parts lookup and troubleshooting.
  - Automated job documentation (photos, notes, time).
  - Personalized context per technician.

---

## **3. The Handoff & Memory Protocol**

### **The Escalation Chain**
1. **JENNY** handles the customer. If a request is out of scope (e.g., complex refund) → **Hand off to ZEKE**.
2. **ZEKE** attempts resolution via admin tools. If it requires owner-level advice or authorization → **Hand off to PRIME**.
3. **PRIME** briefs **Nate** via proactive SMS if critical, otherwise queues for the weekly briefing.

### **Memory Horizons**
- **Short-Term (JENNY)**: Session-based context (minutes).
- **Medium-Term (ZEKE)**: Operational state (weeks).
- **Long-Term (PRIME)**: Strategic history and KPI trends (years).

---

## **4. Implementation Roadmap**

### **Phase 1: Foundation (Current Status)**
- [x] Housecall Pro Webhook Integration.
- [x] ZEKE Proactive Update System.
- [x] GitHub Auto-Fix Workflow.
- [x] SMS Verification System.

### **Phase 2: The Secretary (JENNY Deployment)**
- Formalize JENNY persona with restricted tools.
- Implement web chat and voice routing to JENNY.

### **Phase 3: The Command Center (PRIME & Strategic Memory)**
- Deploy PRIME with access to all business metrics.
- Build "Strategic Goals" database for long-horizon tracking.
- Implement weekly "CEO Briefing" SMS system.

### **Phase 4: Operational Specialization**
- Roll out Marketing, Data, and Order Mgmt agents.
- Integrate automated SEO and inventory monitoring.

### **Phase 5: The Field (Technician Copilots)**
- Build the "Technician Base" identity.
- Deploy individual instances with personalized technician context.

---

## **5. Success Metrics & Guardrails**
- **Human-in-the-Loop**: Nate remains the ultimate authority. No major financial or operational changes occur without PRIME/ZEKE surfacing an approval request.
- **Data Integrity**: All agent actions are logged and verifiable via the Admin Dashboard.
- **Security**: Hierarchical access ensures JENNY cannot access sensitive financial data or system code.
