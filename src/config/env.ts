import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
    DATABASE_URL: process.env.DATABASE_URL as string,
    REDIS_URL: process.env.REDIS_URL as string,
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID as string,
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN as string,
    TWILIO_WHATSAPP_NUMBER: process.env.TWILIO_WHATSAPP_NUMBER as string,
    PORT: parseInt(process.env.PORT || '3000', 10),
};
