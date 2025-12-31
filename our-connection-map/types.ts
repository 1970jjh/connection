
export interface User {
  id: string;
  name: string;
  department: string;
  traits: string[];
  isOnline: boolean;
  currentMatchId?: string;
  metUserIds: string[];
}

export interface Connection {
  id: string;
  userIds: [string, string];
  commonTraits: string[];
}

export interface Room {
  id: string;
  name: string;
  status: 'waiting' | 'running' | 'completed';
  users: Record<string, User>;
  connections: Connection[];
}

export type AppState = {
  activeRoom: Room | null;
  currentUser: User | null;
  view: 'landing' | 'admin' | 'user';
};
