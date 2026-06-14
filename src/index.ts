import Fastify from 'fastify';
import { ENV } from './config/env';
import { twilioWebhookHandler } from './controllers/webhook';

const fastify = Fastify({ logger: true });

// Parse Twilio's x-www-form-urlencoded payloads
fastify.addContentTypeParser('application/x-www-form-urlencoded', function (request, payload, done) {
    let body = '';
    payload.on('data', data => { body += data; });
    payload.on('end', () => {
        const parsed = new URLSearchParams(body);
        const result: Record<string, string> = {};
        for (const [key, value] of parsed.entries()) {
            result[key] = value;
        }
        done(null, result);
    });
});

fastify.post('/webhook', twilioWebhookHandler);

const start = async () => {
    try {
        await fastify.listen({ port: ENV.PORT, host: '0.0.0.0' });
        console.log(`Server is running on port ${ENV.PORT}`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
