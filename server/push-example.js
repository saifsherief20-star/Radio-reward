// npm i express web-push   |   npx web-push generate-vapid-keys
// run: VAPID_PUBLIC=... VAPID_PRIVATE=... node push-example.js
const express=require('express'),webpush=require('web-push');
webpush.setVapidDetails('mailto:you@radiocafe.com',process.env.VAPID_PUBLIC,process.env.VAPID_PRIVATE);
const app=express();app.use(express.json());
const subs=new Map(); // demo only: store subscriptions in your database, linked to the customer
app.post('/api/push/subscribe',(req,res)=>{subs.set(req.body.endpoint,req.body);res.sendStatus(201)});
// IMPORTANT: protect this route with admin login before going live
app.post('/api/push/send',async(req,res)=>{const{title,body,url}=req.body;let sent=0;
 for(const[k,s]of subs){try{await webpush.sendNotification(s,JSON.stringify({title,body,url}));sent++}
  catch(e){if(e.statusCode==404||e.statusCode==410)subs.delete(k)}}
 res.json({sent})});
app.listen(3000);
