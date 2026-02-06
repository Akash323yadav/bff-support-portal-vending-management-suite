const webpush = require('web-push');
const fs = require('fs');
const vapidKeys = webpush.generateVAPIDKeys();
const content = `VAPID_PUBLIC_KEY=${vapidKeys.publicKey}\nVAPID_PRIVATE_KEY=${vapidKeys.privateKey}`;
fs.writeFileSync('vapid_keys.txt', content);
console.log('Keys written to vapid_keys.txt');
