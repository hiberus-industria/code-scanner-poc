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
