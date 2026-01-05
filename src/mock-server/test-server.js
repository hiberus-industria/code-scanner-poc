import express from 'express';

const app = express();
const PORT = 8000;

app.use(express.json());

let receivedEvents = [];
let receivedWeights = [];

app.get('/', (req, res) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Scanner Events Dashboard</title>
      <style>
        body { font-family: Arial; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        .section { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
        pre { background: #f8f9fa; padding: 15px; border-radius: 4px; overflow-x: auto; max-height: 500px; overflow-y: auto; }
        .count { font-size: 24px; color: #007bff; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="section">
          <h1>Barcode Events: ${receivedEvents.length}</h1>
          <pre>${JSON.stringify(receivedEvents, null, 2)}</pre>
        </div>
        
        <div class="section">
          <h1>Weight Events: ${receivedWeights.length}</h1>
          <pre>${JSON.stringify(receivedWeights, null, 2)}</pre>
        </div>
      </div>
      <script>
        setTimeout(() => location.reload(), 2000);
      </script>
    </body>
    </html>
  `;
  res.send(html);
});

app.post('/events', (req, res) => {
  console.log('POST /events recibido:', req.body);
  receivedEvents.push({
    timestamp: new Date().toISOString(),
    data: req.body,
  });

  if (receivedEvents.length > 50) {
    receivedEvents = receivedEvents.slice(-50);
  }

  res.status(200).json({ received: true });
});

app.post('/weight', (req, res) => {
  console.log('POST /weight recibido:', req.body);
  receivedWeights.push({
    timestamp: new Date().toISOString(),
    data: req.body,
  });

  if (receivedWeights.length > 50) {
    receivedWeights = receivedWeights.slice(-50);
  }

  res.status(200).json({ received: true });
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
