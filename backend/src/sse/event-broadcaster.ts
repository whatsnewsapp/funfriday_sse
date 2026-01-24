import { getConnections } from './connection-manager.js';

export interface SSEEvent {
  event: string;
  data: unknown;
}

export async function broadcastToParty(partyId: string, event: SSEEvent): Promise<void> {
  const connections = getConnections(partyId);

  if (connections.length === 0) {
    console.log(`⚠️  No connections to broadcast to for party ${partyId}`);
    return;
  }

  const message = `data: ${JSON.stringify(event)}\n\n`;

  let successCount = 0;
  let failCount = 0;

  for (const response of connections) {
    try {
      response.write(message);
      successCount++;
    } catch (error) {
      console.error('Error broadcasting to connection:', error);
      failCount++;
    }
  }

  console.log(
    `📡 Broadcast to party ${partyId}: ${event.event} (${successCount} success, ${failCount} failed)`
  );
}

export function sendSSEMessage(message: SSEEvent, res: any): void {
  try {
    res.write(`data: ${JSON.stringify(message)}\n\n`);
  } catch (error) {
    console.error('Error sending SSE message:', error);
  }
}

// Send a heartbeat/keepalive ping
export function sendHeartbeat(res: any): void {
  try {
    res.write(': heartbeat\n\n');
  } catch (error) {
    console.error('Error sending heartbeat:', error);
  }
}
