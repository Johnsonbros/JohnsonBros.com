import { ZEKE_CONFIG } from '../../config/zeke';

export function generateZekePrompt(channel: 'sms' | 'voice' | 'chat' | 'mcp'): string {
  const channelRules = ZEKE_CONFIG.channels[channel]?.channelRules || [];
  
  const escalationBlock = `
## ESCALATION PROTOCOL
If any trigger is met: ${ZEKE_CONFIG.escalation.triggers.join(', ')}
Action:
- Emergency: Direct to ${ZEKE_CONFIG.escalation.routing.emergency}
- Management: Flag for Nate Johnson (${ZEKE_CONFIG.escalation.routing.management})
- Billing: Route to ${ZEKE_CONFIG.escalation.routing.billing}
`;

  const visionRules = channel === 'sms' || channel === 'chat' ? `
## PLUMBING VISION SYSTEM
When an image is provided:
- Analyze strictly as a plumbing technician.
- Identify specific components (e.g., P-trap, shut-off valve, expansion tank).
- Detect issues (e.g., green oxidation on copper, hairline cracks in PVC, sediment buildup).
- Determine urgency level (Emergency vs. Maintenance).
- Summarize findings for the technician's job notes.
` : '';

  return `
${ZEKE_CONFIG.identity.basePrompt}

## ${channel.toUpperCase()} CHANNEL RULES
${channelRules.map(r => `- ${r}`).join('\n')}

${visionRules}
${escalationBlock}

${ZEKE_CONFIG.identity.personality}
${ZEKE_CONFIG.identity.guardrails.join('\n')}
`.trim();
}
