import twilio from 'twilio';
import { ENV } from '../config/env';

const client = twilio(ENV.TWILIO_ACCOUNT_SID, ENV.TWILIO_AUTH_TOKEN);

export async function sendMessage(to: string, body: string) {
    await client.messages.create({
        body: body,
        from: ENV.TWILIO_WHATSAPP_NUMBER,
        to: to
    });
}
