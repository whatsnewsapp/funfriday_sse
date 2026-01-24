import { Response } from 'express';

interface SSEConnection {
  response: Response;
  userId: string;
}

// Map of partyId -> Map of userId -> Response
const connections = new Map<string, Map<string, Response>>();

export function addConnection(partyId: string, userId: string, response: Response): void {
  if (!connections.has(partyId)) {
    connections.set(partyId, new Map());
  }

  const partyConnections = connections.get(partyId)!;
  partyConnections.set(userId, response);

  console.log(`✅ SSE connection added: Party ${partyId}, User ${userId}`);
  console.log(`   Total connections in party: ${partyConnections.size}`);
}

export function removeConnection(partyId: string, userId: string): void {
  const partyConnections = connections.get(partyId);
  if (!partyConnections) return;

  partyConnections.delete(userId);
  console.log(`❌ SSE connection removed: Party ${partyId}, User ${userId}`);
  console.log(`   Remaining connections in party: ${partyConnections.size}`);

  // Clean up empty party map
  if (partyConnections.size === 0) {
    connections.delete(partyId);
    console.log(`🗑️  Party ${partyId} connection map deleted (empty)`);
  }
}

export function getConnections(partyId: string): Response[] {
  const partyConnections = connections.get(partyId);
  if (!partyConnections) return [];

  return Array.from(partyConnections.values());
}

export function getConnectionCount(partyId: string): number {
  const partyConnections = connections.get(partyId);
  return partyConnections ? partyConnections.size : 0;
}

export function getAllConnectedUserIds(partyId: string): string[] {
  const partyConnections = connections.get(partyId);
  if (!partyConnections) return [];

  return Array.from(partyConnections.keys());
}

export function hasConnection(partyId: string, userId: string): boolean {
  const partyConnections = connections.get(partyId);
  return partyConnections ? partyConnections.has(userId) : false;
}

export function sendToConnection(
  partyId: string,
  userId: string,
  data: string
): boolean {
  const partyConnections = connections.get(partyId);
  if (!partyConnections) return false;

  const response = partyConnections.get(userId);
  if (!response) return false;

  try {
    response.write(data);
    return true;
  } catch (error) {
    console.error(`Error sending to connection ${userId}:`, error);
    removeConnection(partyId, userId);
    return false;
  }
}
