import { addSseClient } from '../services/sseService.js';

export function streamEvents(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no', // For Nginx / proxy buffering bypass
  });

  addSseClient(res);

  // Send periodic heartbeat to keep the stream alive
  const heartbeatInterval = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch (e) {
      clearInterval(heartbeatInterval);
    }
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeatInterval);
  });
}
