// Firebase 설정 파일
// 아래 값들을 본인의 Firebase 프로젝트 값으로 바꿔주세요!

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// ⚠️ 중요: 이 값들을 Firebase 콘솔에서 복사해서 붙여넣기 하세요!
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "여기에-API-KEY-붙여넣기",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "여기에-AUTH-DOMAIN-붙여넣기",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "여기에-PROJECT-ID-붙여넣기",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "여기에-STORAGE-BUCKET-붙여넣기",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "여기에-SENDER-ID-붙여넣기",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "여기에-APP-ID-붙여넣기"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);

// Firestore 데이터베이스
export const db = getFirestore(app);

export default app;
