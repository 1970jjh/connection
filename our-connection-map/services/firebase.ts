// Firebase 설정 파일
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Firebase 설정값
const firebaseConfig = {
  apiKey: "AIzaSyCh3LKixmsM9n41UL1s0d9g3tUZx8N4J9U",
  authDomain: "connection-4df71.firebaseapp.com",
  projectId: "connection-4df71",
  storageBucket: "connection-4df71.firebasestorage.app",
  messagingSenderId: "640050157914",
  appId: "1:640050157914:web:e337c442b6533366c07b63"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);

// Firestore 데이터베이스
export const db = getFirestore(app);

export default app;
