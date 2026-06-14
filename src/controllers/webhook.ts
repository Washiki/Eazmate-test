import { FastifyRequest, FastifyReply } from 'fastify';
import { handleIncomingMessage } from '../fsm';

export const twilioWebhookHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as Record<string, string>;
    const from = body.From; 
    const message = body.Body; 

    try {
        await handleIncomingMessage(from, message);
        // ADD THIS: Explicitly set the Content-Type to XML
        reply.header('Content-Type', 'text/xml').status(200).send('<Response></Response>'); 
    } catch (error) {
        request.log.error(error);
        reply.status(500).send('Internal Server Error');
    }
};
