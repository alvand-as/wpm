const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      res.status(200).send(challenge);
      return;
    }
    res.status(403).send('Forbidden');
    return;
  }

  if (req.method === 'POST') {
    try {
      const entry = req.body?.entry?.[0];
      const value = entry?.changes?.[0]?.value;
      const messages = value?.messages;

      if (Array.isArray(messages)) {
        for (const m of messages) {
          console.log(
            JSON.stringify({
              receivedAt: new Date().toISOString(),
              from: m.from,
              type: m.type,
              text: m.text?.body ?? null,
              raw: m,
            })
          );
        }
      }
    } catch (err) {
      console.error('webhook processing error', err);
    }

    // Meta expects a fast 200 regardless, or it will retry / eventually disable the webhook.
    res.status(200).send('EVENT_RECEIVED');
    return;
  }

  res.status(405).send('Method Not Allowed');
}
