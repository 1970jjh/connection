// Firebase Firestore 기반 실시간 동기화 스토어
import { db } from './firebase';
import {
  doc,
  setDoc,
  onSnapshot,
  updateDoc,
  deleteField,
  getDoc
} from 'firebase/firestore';
import { Room, User, Connection } from '../types';

// 현재 방 ID (하나의 방만 사용)
const ROOM_DOC_ID = 'current-room';

class GameStore {
  private state: Room | null = null;
  private listeners: Array<() => void> = [];
  private unsubscribeFirestore: (() => void) | null = null;

  constructor() {
    this.subscribeToFirestore();
  }

  // Firebase 실시간 리스너 설정
  private subscribeToFirestore() {
    const roomRef = doc(db, 'rooms', ROOM_DOC_ID);

    this.unsubscribeFirestore = onSnapshot(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        this.state = snapshot.data() as Room;
      } else {
        this.state = null;
      }
      this.notify();
    }, (error) => {
      console.error('Firebase 연결 오류:', error);
    });
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  getRoom() {
    return this.state;
  }

  // 방 생성
  async createRoom(name: string) {
    const roomRef = doc(db, 'rooms', ROOM_DOC_ID);
    const newRoom: Room = {
      id: ROOM_DOC_ID,
      name,
      status: 'waiting',
      users: {},
      connections: [],
    };

    await setDoc(roomRef, newRoom);
    return newRoom;
  }

  // 방 상태 변경
  async updateRoomStatus(status: Room['status']) {
    const roomRef = doc(db, 'rooms', ROOM_DOC_ID);
    await updateDoc(roomRef, { status });

    // 시작하면 바로 매칭 실행
    if (status === 'running') {
      setTimeout(() => this.matchUsers(), 500);
    }
  }

  // 사용자 추가
  async addUser(user: User) {
    const roomRef = doc(db, 'rooms', ROOM_DOC_ID);
    await updateDoc(roomRef, {
      [`users.${user.id}`]: user
    });
  }

  // 사용자 제거
  async removeUser(userId: string) {
    if (!this.state) return;

    const roomRef = doc(db, 'rooms', ROOM_DOC_ID);

    // 매칭 상대가 있으면 상대의 매칭도 해제
    const user = this.state.users[userId];
    if (user?.currentMatchId && this.state.users[user.currentMatchId]) {
      await updateDoc(roomRef, {
        [`users.${user.currentMatchId}.currentMatchId`]: deleteField()
      });
    }

    await updateDoc(roomRef, {
      [`users.${userId}`]: deleteField()
    });
  }

  // 사용자 정보 업데이트
  async updateUser(user: Partial<User> & { id: string }) {
    if (!this.state || !this.state.users[user.id]) return;

    const roomRef = doc(db, 'rooms', ROOM_DOC_ID);
    const updates: Record<string, any> = {};

    Object.keys(user).forEach(key => {
      if (key !== 'id') {
        updates[`users.${user.id}.${key}`] = (user as any)[key];
      }
    });

    await updateDoc(roomRef, updates);
  }

  // 연결 추가
  async addConnection(conn: Connection) {
    if (!this.state) return;

    const roomRef = doc(db, 'rooms', ROOM_DOC_ID);
    const [u1, u2] = conn.userIds;

    // 새 연결 배열 생성
    const newConnections = [...this.state.connections, conn];

    // metUserIds 업데이트
    const u1MetIds = [...(this.state.users[u1]?.metUserIds || []), u2];
    const u2MetIds = [...(this.state.users[u2]?.metUserIds || []), u1];

    await updateDoc(roomRef, {
      connections: newConnections,
      [`users.${u1}.metUserIds`]: u1MetIds,
      [`users.${u2}.metUserIds`]: u2MetIds
    });
  }

  // 사용자 매칭
  async matchUsers() {
    if (!this.state || this.state.status !== 'running') return;

    const roomRef = doc(db, 'rooms', ROOM_DOC_ID);

    // 최신 데이터 가져오기
    const snapshot = await getDoc(roomRef);
    if (!snapshot.exists()) return;

    const currentRoom = snapshot.data() as Room;

    const availableUsers = Object.values(currentRoom.users).filter(
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

    if (matchedPairs.length > 0) {
      const updates: Record<string, any> = {};

      matchedPairs.forEach(([id1, id2]) => {
        updates[`users.${id1}.currentMatchId`] = id2;
        updates[`users.${id2}.currentMatchId`] = id1;
      });

      await updateDoc(roomRef, updates);
    }
  }

  // 매칭 해제
  async clearMatch(userId: string) {
    if (!this.state) return;

    const user = this.state.users[userId];
    if (!user || !user.currentMatchId) return;

    const partnerId = user.currentMatchId;
    const roomRef = doc(db, 'rooms', ROOM_DOC_ID);

    await updateDoc(roomRef, {
      [`users.${userId}.currentMatchId`]: deleteField(),
      [`users.${partnerId}.currentMatchId`]: deleteField()
    });

    // 잠시 후 새로운 매칭 시도
    setTimeout(() => this.matchUsers(), 1000);
  }
}

export const store = new GameStore();
