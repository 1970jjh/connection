# 우리들의 연결고리 - Connection Map

교육생들이 서로의 공통점을 찾아 연결되는 실시간 네트워킹 앱입니다.

---

# 초등학생도 따라할 수 있는 배포 가이드

## 전체 순서
1. Firebase 프로젝트 만들기 (무료)
2. Firebase 설정값 복사하기
3. GitHub에 코드 올리기
4. Vercel에서 배포하기

---

## 1단계: Firebase 프로젝트 만들기

### 1-1. Firebase 사이트 접속
1. 인터넷 브라우저를 열어요
2. 주소창에 `firebase.google.com` 입력하고 엔터!
3. 오른쪽 위에 **"콘솔로 이동"** 버튼 클릭
4. Google 계정으로 로그인 (없으면 만들기)

### 1-2. 새 프로젝트 만들기
1. **"프로젝트 추가"** 클릭
2. 프로젝트 이름 입력: `connection-map` (아무 이름이나 OK)
3. Google 애널리틱스는 **"사용 안함"** 선택 (더 쉬워요!)
4. **"프로젝트 만들기"** 클릭
5. 잠시 기다리면 완료! **"계속"** 클릭

### 1-3. 웹 앱 등록하기
1. 프로젝트 메인 화면에서 **`</>`** 아이콘 클릭 (웹 아이콘)
2. 앱 이름 입력: `connection-web`
3. **"앱 등록"** 클릭
4. 여기서 나오는 설정값을 복사해두세요! (아래 예시 참고)

```javascript
// 이런 코드가 나와요 - 이걸 복사해두세요!
const firebaseConfig = {
  apiKey: "AIzaSy.....................",
  authDomain: "connection-map-xxxxx.firebaseapp.com",
  projectId: "connection-map-xxxxx",
  storageBucket: "connection-map-xxxxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdefgh"
};
```

### 1-4. Firestore 데이터베이스 만들기
1. 왼쪽 메뉴에서 **"Firestore Database"** 클릭
2. **"데이터베이스 만들기"** 클릭
3. **"테스트 모드에서 시작"** 선택 (중요!)
4. 위치는 **"asia-northeast3 (서울)"** 선택
5. **"사용 설정"** 클릭
6. 완료될 때까지 기다리기

---

## 2단계: 코드에 Firebase 설정값 넣기

### 2-1. 환경변수 파일 만들기
1. 프로젝트 폴더에서 `.env.example` 파일을 복사해요
2. 복사한 파일 이름을 `.env.local` 로 바꿔요
3. 아까 복사해둔 Firebase 설정값을 넣어요:

```bash
VITE_FIREBASE_API_KEY=AIzaSy.....................
VITE_FIREBASE_AUTH_DOMAIN=connection-map-xxxxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=connection-map-xxxxx
VITE_FIREBASE_STORAGE_BUCKET=connection-map-xxxxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdefgh
```

---

## 3단계: GitHub에 코드 올리기

### 3-1. GitHub 저장소 만들기
1. `github.com` 접속 후 로그인
2. 오른쪽 위 **"+"** 버튼 -> **"New repository"**
3. Repository name: `connection-map`
4. **"Create repository"** 클릭

### 3-2. 코드 올리기 (터미널에서)
```bash
cd our-connection-map
git init
git add .
git commit -m "첫 번째 커밋"
git branch -M main
git remote add origin https://github.com/내아이디/connection-map.git
git push -u origin main
```

---

## 4단계: Vercel에서 배포하기

### 4-1. Vercel 가입하기
1. `vercel.com` 접속
2. **"Sign Up"** 클릭
3. **"Continue with GitHub"** 선택 (GitHub 계정으로 로그인)

### 4-2. 프로젝트 가져오기
1. **"Add New..."** -> **"Project"** 클릭
2. GitHub 저장소 목록에서 `connection-map` 찾기
3. **"Import"** 클릭

### 4-3. 환경변수 설정하기 (중요!)
1. **"Environment Variables"** 섹션 찾기
2. 아래 6개를 하나씩 추가해요:

| Name | Value |
|------|-------|
| `VITE_FIREBASE_API_KEY` | 내 API 키 |
| `VITE_FIREBASE_AUTH_DOMAIN` | 내 Auth Domain |
| `VITE_FIREBASE_PROJECT_ID` | 내 Project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | 내 Storage Bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | 내 Sender ID |
| `VITE_FIREBASE_APP_ID` | 내 App ID |

3. **"Deploy"** 버튼 클릭!
4. 2-3분 기다리면 완료!

### 4-4. 배포 완료!
- Vercel이 주는 주소로 접속하면 끝!
- 예: `https://connection-map-xxxxx.vercel.app`

---

## 사용 방법

### 강사 (관리자)
1. PC 브라우저로 접속
2. **"과정 개설하기"** 클릭
3. 비밀번호 입력: `6749467`
4. 과정명 입력 (예: "12월 리더십 과정")
5. 참가자들이 입장하면 **"연결고리 시작"** 클릭!

### 참가자 (교육생)
1. 모바일로 접속
2. **"참가하기"** 클릭
3. 과정명, 이름, 소속 입력
4. 본인 특징 10가지 입력
5. 매칭 기다리기!

---

## 문제 해결

### "Firebase 연결 오류" 가 뜰 때
- 환경변수가 제대로 설정되었는지 확인
- Firestore 데이터베이스가 만들어졌는지 확인

### 모바일과 PC가 동기화 안될 때
- 같은 URL로 접속했는지 확인
- 인터넷 연결 확인

### 배포가 안될 때
- Vercel 환경변수 6개 모두 입력했는지 확인
- GitHub에 코드가 제대로 올라갔는지 확인

---

## QR 코드로 쉽게 접속하기

배포 후 Vercel 주소를 QR 코드로 만들어서 교육장에 띄워두면,
참가자들이 스마트폰으로 쉽게 접속할 수 있어요!

무료 QR 코드 생성: `qr-code-generator.com`
