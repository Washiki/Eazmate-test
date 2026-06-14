### SETUP

For setup, after cloning the repo, perform the following:
(after cd into repo)

```bash

npm install 

sudo docker-compose up -d 

npx prisma db:push 

```

### RUNNING

(For this, there is a seed.ts that we can run to populate the prisma db with info. Before execution, run `npx tsx src/seed.ts` in root to do that first)

To run, perform the following:

```bash
#TERMINAL 1
npm run dev

```

```bash
#TERMINAL 2
ngrok http 3000
```

In terminal 2, after connection, take the link provided and paste it in the twilio sandbox settings url under the "when message comes in". 
Add the /webhook after it, and save it. (That's the route ive set up)

Now, connect to the sandbox on twilio (enter the join <sandbox name> in the chat) and it will start. 


### NOTES:

The current update is for v1, which utilizes only text inputs from the user, and NOT the whatsapp list messages (exhausted free twilio credits before getting to that). 
