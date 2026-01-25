# Security Systems & Procedures To-Do

## Immediate Security Enhancements
- [ ] **Implement IP Whitelisting for Admin Dashboard**
  - *Procedure:* Modify `server/src/auth.ts` to check `req.ip` against an environment-stored whitelist for routes starting with `/admin`.
- [ ] **Enhanced Logging for Sensitive Deletions**
  - *Procedure:* Update `IStorage` delete methods to trigger a `logActivity` event specifically flagged as "critical_delete".
- [ ] **Automatic Session Revocation on Password Change**
  - *Procedure:* Ensure `revokeUserSessions(userId)` is called immediately after a successful password update.

## Maintenance Procedures
- [ ] **Quarterly API Key Rotation**
  - *Schedule:* Jan 1st, April 1st, July 1st, Oct 1st.
  - *Procedure:* Update Replit Secrets for Twilio, HousecallPro, and Deepgram. Restart application.
- [ ] **Admin Access Audit**
  - *Schedule:* First Monday of every month.
  - *Procedure:* Super Admin must review `admin_users` table and set `isActive = false` for any inactive or departed staff.

## Emergency Protocols
- [ ] **System-Wide Session Revocation**
  - *Trigger:* Suspected admin credential leak.
  - *Action:* Execute `revokeAllSessions()` via the server console or a protected emergency endpoint.
- [ ] **Database Snapshot/Rollback**
  - *Action:* Use Replit Checkpoints to restore code and database to the last known "clean" state.
