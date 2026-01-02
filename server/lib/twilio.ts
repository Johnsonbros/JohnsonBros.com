// Twilio integration using Replit's connector system
import twilio from 'twilio';

interface TwilioCredentials {
  accountSid: string;
  apiKey: string;
  apiKeySecret: string;
  phoneNumber: string;
}

let cachedCredentials: TwilioCredentials | null = null;

async function getCredentials(): Promise<TwilioCredentials> {
  if (cachedCredentials) {
    return cachedCredentials;
  }

  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('Twilio credentials not available - X_REPLIT_TOKEN not found');
  }

  const response = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=twilio',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  );

  const data = await response.json();
  const connectionSettings = data.items?.[0];

  if (!connectionSettings || !connectionSettings.settings.account_sid || 
      !connectionSettings.settings.api_key || !connectionSettings.settings.api_key_secret) {
    throw new Error('Twilio not connected - please set up Twilio integration');
  }

  cachedCredentials = {
    accountSid: connectionSettings.settings.account_sid,
    apiKey: connectionSettings.settings.api_key,
    apiKeySecret: connectionSettings.settings.api_key_secret,
    phoneNumber: connectionSettings.settings.phone_number || ''
  };

  return cachedCredentials;
}

export async function getTwilioClient(): Promise<twilio.Twilio> {
  const { accountSid, apiKey, apiKeySecret } = await getCredentials();
  return twilio(apiKey, apiKeySecret, { accountSid });
}

export async function getTwilioPhoneNumber(): Promise<string> {
  const { phoneNumber } = await getCredentials();
  return phoneNumber;
}

export async function sendSMS(to: string, body: string): Promise<any> {
  const client = await getTwilioClient();
  const from = await getTwilioPhoneNumber();
  
  if (!from) {
    throw new Error('No Twilio phone number configured');
  }

  return client.messages.create({
    body,
    from,
    to
  });
}

export function generateTwiML(message: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${escapeXml(message)}</Message>
</Response>`;
}

export function generateVoiceTwiML(message: string, options?: { gather?: boolean; action?: string }): string {
  let twiml = `<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n`;
  
  if (options?.gather) {
    twiml += `  <Gather input="speech" action="${options.action || '/api/v1/twilio/voice'}" method="POST" speechTimeout="auto">\n`;
    twiml += `    <Say voice="alice">${escapeXml(message)}</Say>\n`;
    twiml += `  </Gather>\n`;
    twiml += `  <Say voice="alice">I didn't hear anything. Goodbye.</Say>\n`;
  } else {
    twiml += `  <Say voice="alice">${escapeXml(message)}</Say>\n`;
  }
  
  twiml += `</Response>`;
  return twiml;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
