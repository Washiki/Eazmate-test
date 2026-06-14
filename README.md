## Eazmate Test

Tools used for this :

- The backend is built via of `node.js` and `typescript`. 

- For handling HTTP requests, we use `Fastify` 

- The persistent memory is handled via 'Postgresql'  and 'Prisma'

- Session management and cache memory was handled via 'Redis'

- End point interaction via whatsapp handled via Twilio's API. 

### SETUP

For setup, after cloning the repo, perform the following:
(after cd into repo)

Create a `.env` file in the root directory with the following:
```env
PORT=3000
DATABASE_URL="postgresql://postgres:password@localhost:5432/ecommerce_bot?schema=public"
REDIS_URL="redis://127.0.0.1:6379"
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your_twilio_auth_token"
TWILIO_WHATSAPP_NUMBER="whatsapp:twilio_number"
```

After creating this file, run the following:

```bash

npm install 

sudo docker-compose up -d 

npx prisma db:push 

```



### RUNNING
(For testing and demonstration, we need to populate db with test data. To do that, i've added a `seed.ts` file. Run this as `npx tsx src/seed.ts' in the root dir.)

To run the bot, perform the following:

```bash
#TERMINAL 1
npm run dev

```

```bash
#TERMINAL 2
ngrok http 3000
```

In terminal 2, after connection, take the link provided and paste it in the twilio sandbox settings url under the "when message comes in". 
Add the /webhook after it before saving it, as that's the setup route.

Now, connect to the sandbox on twilio (enter the join <sandbox name> in the chat) and it will start. 


### NOTES:

The current update is for ver 1, which does NOT have whatsapp list message integration (finished twilio credits for the day before getting to them). This version only sends text messages to interact with the user.

This was to focus mostly on implementing the finite state machine style working and have it 1) interact with all the services 2) work at scale. Will focus on adding more whatsapp specific qol features soon.
