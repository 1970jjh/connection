
import { Room, User, Connection } from '../types';

const STORAGE_KEY = 'OUR_CONNECTION_MAP_STATE';

class GameStore {
  private state: Room | null = null;
  private listeners: Array<() => void> = [];

  constructor() {
    this.load();
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEY) {
        this.load();
        this.notify();
      }
    });
  }

  private load() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      this.state = JSON.parse(data);
    }
  }

  private save() {
    if (this.state) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      window.dispatchEvent(new Event('storage_update'));
    }
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    window.addEventListener('storage_update', listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
      window.removeEventListener('storage_update', listener);
    };
  }

  getRoom() {
    return this.state;
  }

  createRoom(name: string) {
    const id = Math.random().toString(36).substring(7);
    this.state = {
      id,
      name,
      status: 'waiting',
      users: {},
      connections: [],
    };
    this.save();
    this.notify();
    return this.state;
  }

  updateRoomStatus(status: Room['status']) {
    if (this.state) {
      this.state.status = status;
      this.save();
      this.notify();
    }
  }

  addUser(user: User) {
    if (this.state) {
      this.state.users[user.id] = user;
      this.save();
      this.notify();
    }
  }

  removeUser(userId: string) {
    if (this.state && this.state.users[userId]) {
      // Clear match if they were in one
      const partnerId = this.state.users[userId].currentMatchId;
      if (partnerId && this.state.users[partnerId]) {
        this.state.users[partnerId].currentMatchId = undefined;
      }
      
      delete this.state.users[userId];
      // Optional: remove their connections or keep them as "Unknown User"
      this.save();
      this.notify();
    }
  }

  updateUser(user: Partial<User> & { id: string }) {
    if (this.state && this.state.users[user.id]) {
      this.state.users[user.id] = { ...this.state.users[user.id], ...user };
      this.save();
      this.notify();
    }
  }

  addConnection(conn: Connection) {
    if (this.state) {
      this.state.connections.push(conn);
      const [u1, u2] = conn.userIds;
      if (this.state.users[u1]) this.state.users[u1].metUserIds.push(u2);
      if (this.state.users[u2]) this.state.users[u2].metUserIds.push(u1);
      this.save();
      this.notify();
    }
  }

  matchUsers() {
    if (!this.state || this.state.status !== 'running') return;

    const availableUsers = Object.values(this.state.users).filter(
      (u) => !u.currentMatchId && u.isOnline && u.traits.length === 10
    );

    const shuffled = [...availableUsers].sort(() => Math.random() - 0.5);
    const matchedPairs: [string, string][] = [];
    const usedIds = new Set<string>();

    for (let i = 0; i < shuffled.length; i++) {
      const u1 = shuffled[i];
      if (usedIds.has(u1.id)) continue;

      for (let j = i + 1; j < shuffled.length; j++) {
        const u2 = shuffled[j];
        if (usedIds.has(u2.id)) continue;

        if (!u1.metUserIds.includes(u2.id)) {
          matchedPairs.push([u1.id, u2.id]);
          usedIds.add(u1.id);
          usedIds.add(u2.id);
          break;
        }
      }
    }

    matchedPairs.forEach(([id1, id2]) => {
      if (this.state) {
        this.state.users[id1].currentMatchId = id2;
        this.state.users[id2].currentMatchId = id1;
      }
    });

    if (matchedPairs.length > 0) {
      this.save();
      this.notify();
    }
  }

  clearMatch(userId: string) {
    if (this.state) {
      const u = this.state.users[userId];
      if (u && u.currentMatchId) {
        const partnerId = u.currentMatchId;
        this.state.users[userId].currentMatchId = undefined;
        if (this.state.users[partnerId]) {
          this.state.users[partnerId].currentMatchId = undefined;
        }
        this.save();
        this.notify();
      }
    }
  }
}

export const store = new GameStore();
