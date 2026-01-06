// Firebase Firestore 기반 실시간 동기화 스토어
import { db } from './firebase';
import {
  doc,
  setDoc,
  onSnapshot,
  updateDoc,
  deleteField,
  getDoc,
  runTransaction,
  arrayUnion
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
        const data = snapshot.data();
        // users와 connections이 undefined일 수 있으므로 기본값 설정
        this.state = {
          ...data,
          users: data.users || {},
          connections: data.connections || [],
        } as Room;
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

  // 연결 추가 (개별 제출 지원, 동시 작성 오류 방지)
  async addConnection(conn: Connection, submitterId: string, traits: string[]) {
    if (!this.state) return;

    const roomRef = doc(db, 'rooms', ROOM_DOC_ID);

    // 트랜잭션으로 동시 작성 오류 방지
    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(roomRef);
      if (!snapshot.exists()) return;

      const data = snapshot.data() as Room;
      const existingConnections = data.connections || [];

      // 이미 존재하는 연결인지 확인 (같은 그룹)
      const existingConnIdx = existingConnections.findIndex(
        c => c.id === conn.id ||
        (c.userIds.length === conn.userIds.length &&
         c.userIds.every(id => conn.userIds.includes(id)))
      );

      let updatedConnections: Connection[];
      let newConnection: Connection;

      if (existingConnIdx >= 0) {
        // 기존 연결에 개별 제출 추가
        const existingConn = existingConnections[existingConnIdx];
        newConnection = {
          ...existingConn,
          submittedBy: existingConn.submittedBy.includes(submitterId)
            ? existingConn.submittedBy
            : [...existingConn.submittedBy, submitterId],
          individualTraits: {
            ...existingConn.individualTraits,
            [submitterId]: traits
          },
          commonTraits: [
            ...new Set([
              ...existingConn.commonTraits,
              ...traits
            ])
          ]
        };
        updatedConnections = [
          ...existingConnections.slice(0, existingConnIdx),
          newConnection,
          ...existingConnections.slice(existingConnIdx + 1)
        ];
      } else {
        // 새 연결 생성
        newConnection = {
          ...conn,
          submittedBy: [submitterId],
          individualTraits: { [submitterId]: traits },
          createdAt: Date.now()
        };
        updatedConnections = [...existingConnections, newConnection];
      }

      // metUserIds 업데이트 및 점수 계산
      const updates: Record<string, any> = {
        connections: updatedConnections
      };

      // 각 사용자의 metUserIds 업데이트 및 점수 계산
      conn.userIds.forEach(userId => {
        const user = data.users[userId];
        if (user) {
          const otherUserIds = conn.userIds.filter(id => id !== userId);
          const newMetIds = [...new Set([...(user.metUserIds || []), ...otherUserIds])];
          updates[`users.${userId}.metUserIds`] = newMetIds;

          // 점수 계산: 그룹 크기 보너스 + 공통점 개수
          const groupBonus = conn.groupSize === 3 ? 1.5 : 1;
          const traitsScore = traits.length * 10 * groupBonus;
          const currentScore = user.score || 0;
          updates[`users.${userId}.score`] = currentScore + traitsScore;
        }
      });

      transaction.update(roomRef, updates);
    });
  }

  // 연결 ID로 연결 찾기
  findConnectionByUsers(userIds: string[]): Connection | undefined {
    if (!this.state) return undefined;
    return this.state.connections.find(c =>
      c.userIds.length === userIds.length &&
      c.userIds.every(id => userIds.includes(id))
    );
  }

  // 사용자 매칭 (홀수일 경우 3인 그룹 지원)
  async matchUsers() {
    if (!this.state || this.state.status !== 'running') return;

    const roomRef = doc(db, 'rooms', ROOM_DOC_ID);

    // 최신 데이터 가져오기
    const snapshot = await getDoc(roomRef);
    if (!snapshot.exists()) return;

    const data = snapshot.data();
    const currentRoom = {
      ...data,
      users: data.users || {},
      connections: data.connections || [],
    } as Room;

    const availableUsers = Object.values(currentRoom.users || {}).filter(
      (u) => !u.currentMatchId && !u.currentMatchIds?.length && u.isOnline && u.traits.length === 10
    );

    if (availableUsers.length < 2) return;

    const shuffled = [...availableUsers].sort(() => Math.random() - 0.5);
    const matchedPairs: string[][] = []; // 2인 또는 3인 그룹
    const usedIds = new Set<string>();

    // 홀수인 경우 첫 번째로 3인 그룹 만들기
    if (shuffled.length >= 3 && shuffled.length % 2 === 1) {
      // 서로 만나지 않은 3명 찾기
      let foundTriple = false;
      for (let i = 0; i < shuffled.length && !foundTriple; i++) {
        const u1 = shuffled[i];
        for (let j = i + 1; j < shuffled.length && !foundTriple; j++) {
          const u2 = shuffled[j];
          if (u1.metUserIds.includes(u2.id)) continue;

          for (let k = j + 1; k < shuffled.length && !foundTriple; k++) {
            const u3 = shuffled[k];
            if (u1.metUserIds.includes(u3.id) || u2.metUserIds.includes(u3.id)) continue;

            // 3명 모두 서로 처음 만남
            matchedPairs.push([u1.id, u2.id, u3.id]);
            usedIds.add(u1.id);
            usedIds.add(u2.id);
            usedIds.add(u3.id);
            foundTriple = true;
          }
        }
      }

      // 완벽한 3인 조합을 못 찾으면, 최선의 3인 조합 (이미 만난 사람 포함)
      if (!foundTriple && shuffled.length >= 3) {
        const [u1, u2, u3] = shuffled.slice(0, 3);
        matchedPairs.push([u1.id, u2.id, u3.id]);
        usedIds.add(u1.id);
        usedIds.add(u2.id);
        usedIds.add(u3.id);
      }
    }

    // 남은 사용자들 2인 매칭
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

    // 아직 매칭 안 된 사람들 (이미 만난 사람들끼리도 매칭)
    const stillAvailable = shuffled.filter(u => !usedIds.has(u.id));
    while (stillAvailable.length >= 2) {
      const [u1, u2] = stillAvailable.splice(0, 2);
      matchedPairs.push([u1.id, u2.id]);
    }

    if (matchedPairs.length > 0) {
      const updates: Record<string, any> = {};

      matchedPairs.forEach((group) => {
        if (group.length === 2) {
          // 2인 매칭
          const [id1, id2] = group;
          updates[`users.${id1}.currentMatchId`] = id2;
          updates[`users.${id2}.currentMatchId`] = id1;
          // currentMatchIds 초기화
          updates[`users.${id1}.currentMatchIds`] = deleteField();
          updates[`users.${id2}.currentMatchIds`] = deleteField();
        } else {
          // 3인 매칭
          group.forEach(userId => {
            const otherIds = group.filter(id => id !== userId);
            updates[`users.${userId}.currentMatchIds`] = otherIds;
            updates[`users.${userId}.currentMatchId`] = deleteField();
          });
        }
      });

      await updateDoc(roomRef, updates);
    }
  }

  // 매칭 해제 (2인 또는 3인 그룹 지원)
  async clearMatch(userId: string) {
    if (!this.state) return;

    const user = this.state.users[userId];
    if (!user) return;

    const roomRef = doc(db, 'rooms', ROOM_DOC_ID);
    const updates: Record<string, any> = {};

    if (user.currentMatchIds?.length) {
      // 3인 그룹 해제
      const allGroupIds = [userId, ...user.currentMatchIds];
      allGroupIds.forEach(id => {
        updates[`users.${id}.currentMatchIds`] = deleteField();
        updates[`users.${id}.currentMatchId`] = deleteField();
      });
    } else if (user.currentMatchId) {
      // 2인 매칭 해제
      const partnerId = user.currentMatchId;
      updates[`users.${userId}.currentMatchId`] = deleteField();
      updates[`users.${partnerId}.currentMatchId`] = deleteField();
    } else {
      return; // 매칭 없음
    }

    await updateDoc(roomRef, updates);

    // 잠시 후 새로운 매칭 시도
    setTimeout(() => this.matchUsers(), 1000);
  }
}

export const store = new GameStore();
