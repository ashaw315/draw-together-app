const Pusher = require('pusher');

const pusher = new Pusher({
  appId: process.env.NEXT_PUBLIC_PUSHER_APP_ID,
  key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY,
  secret: process.env.NEXT_PUBLIC_PUSHER_APP_SECRET,
  cluster: process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER,
  useTLS: true
});

export default async function handler(req, res) {
    pusher.trigger('scribble-lounge', 'new-line', {
      message: 'hello world'
    });
    
    res.status(200).json({ message: 'line sent' });
  }