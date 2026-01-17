
import crypto from 'crypto';

const generateSecret = (length = 32) => {
    return crypto.randomBytes(length).toString('hex');
};

const secrets = {
    SESSION_SECRET: generateSecret(32),
    HOUSECALL_WEBHOOK_SECRET: generateSecret(32),
    INTERNAL_SECRET: generateSecret(32),
    INTERNAL_ADMIN_TOKEN: generateSecret(32),
};

console.log('generated secrets (copy to .env):');
console.log('=====================================================');
Object.entries(secrets).forEach(([key, value]) => {
    console.log(`${key}=${value}`);
});
console.log('=====================================================');
console.log('\nremember to also set these external keys if not already set:');
console.log('- HOUSECALL_PRO_API_KEY');
console.log('- GOOGLE_MAPS_API_KEY');
console.log('- SUPER_ADMIN_EMAIL');
