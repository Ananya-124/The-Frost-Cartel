import type { Response } from 'express';

interface SSEClient {
  id: string;
  teamId?: string;
  res: Response;
}

class EventBus {
  private clients: SSEClient[] = [];

  public addClient(client: SSEClient): void {
    this.clients.push(client);
  }

  public removeClient(id: string): void {
    this.clients = this.clients.filter(c => c.id !== id);
  }

  public broadcastToTeam(teamId: string, event: string, data: unknown): void {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const client of this.clients) {
      if (client.teamId === teamId) {
        try {
          client.res.write(payload);
        } catch {
          // Client disconnected
        }
      }
    }
  }

  public broadcastAll(event: string, data: unknown): void {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const client of this.clients) {
      try {
        client.res.write(payload);
      } catch {
        // Client disconnected
      }
    }
  }

  public emitEvent(event: string, data: unknown): void {
    this.broadcastAll(event, data);
  }
}

export const eventBus = new EventBus();

