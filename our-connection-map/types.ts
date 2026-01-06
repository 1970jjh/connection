
export interface User {
  id: string;
  name: string;
  department: string;
  traits: string[];
  isOnline: boolean;
  currentMatchId?: string;
  currentMatchIds?: string[]; // 3인 매칭 지원
  metUserIds: string[];
  score: number; // 점수
}

export interface Connection {
  id: string;
  userIds: string[]; // 2-3명 지원
  commonTraits: string[];
  submittedBy: string[]; // 제출한 사용자 ID 목록
  individualTraits: Record<string, string[]>; // 각 사용자가 개별 작성한 공통점
  groupSize: number; // 그룹 크기 (2 또는 3)
  createdAt: number; // 생성 시간
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
