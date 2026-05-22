export interface Participant {
  id: string; // e.g. "A1", "A2", "B1"
  name: string;
  hospital: "國泰" | "台大" | "馬偕";
  group: string; // "A", "B", "C", "D", "E"
  roleCode: string; // "A1", "A2", etc.
}

export interface Instructor {
  id: number;
  name: string;
  hospital: string;
  title: string;
}

export interface TimetableSlot {
  time: string;
  room1: string; // 婦產科醫局
  room2: string; // 兒科醫局
  type: "prep" | "session" | "break";
}

export interface ScoreCard {
  candidateId: string;
  candidateName: string;
  candidateHospital: string;
  evaluatorId: string;
  evaluatorName: string;
  date: string;
  
  // Section 1: 病史詢問 (Max raw: 15 + 7 global = 22)
  history: {
    s1: number; // 症狀發生時間與進展 (0-2)
    s2: number; // 胸痛特徵 (0-2)
    s3: number; // 低灌流症狀 (0-2)
    s4: number; // 感染或脫水誘因 (0-2)
    s5: number; // 過去病史 (0-1)
    s6: number; // 用藥史 (0-2)
    s7: number; // 藥物過量或重複服藥 (0-2)
    s8: number; // 個人及家庭支持狀況 (0-2)
    global: number; // 史整體評分 (0-7, L1-L4)
    feedback: string;
  };

  // Section 2: 身體檢查 (Max raw: 10 + 5 global = 15)
  physical: {
    p1: number; // 胸部檢查 (0-2)
    p2: number; // 心臟與循環 (0-2)
    p3: number; // 水分狀態 (0-2)
    p4: number; // 感染來源 (0-2)
    p5: number; // 意識與神經學 (0-2)
    global: number; // 身體診察整體評分 (0-5)
    feedback: string;
  };

  // Section 3: 初步臆斷 (Max raw: 5)
  diagnosis: {
    d1: number; // 不穩定 bradyarrhythmia (0-1)
    d2: number; // 藥物相關 (0-1)
    d3: number; // 電解質異常 (0-1)
    d4: number; // 脫水休克 (0-1)
    d5: number; // ACS (0-1)
    feedback: string;
  };

  // Section 4: 安排的檢查與判讀 (Max raw: 4 + 8 global = 12)
  investigations: {
    i1: number; // ECG (0-1)
    i2: number; // Blood test (0-2)
    i3: number; // CXR (0-1)
    global: number; // 檢驗檢查整體評分 (0-8)
    feedback: string;
  };

  // Section 5: 鑑別診斷 (Max raw: 6 + 4 global = 10)
  differential: {
    dd1: number; // BRASH syndrome (0-3)
    dd2: number; // 藥物相關心搏過慢 (0-1)
    dd3: number; // 高血鉀心搏過慢 (0-1)
    dd4: number; // 脫水造成 AKI... (0-1)
    global: number; // 鑑別診斷整體評分 (0-4)
    feedback: string;
  };

  // Section 6: 治療處置 (Max raw: 12 + 5 global = 17)
  treatment: {
    tx1: number; // 初始穩定與監測 (0-1)
    tx2: number; // 處理 unstable bradycardia (0-3)
    tx3: number; // 立即治療高血鉀穩定心肌 (0-2)
    tx4: number; // 降低血鉀 (0-4)
    tx5: number; // 處理 BRASH 誘因 (0-2)
    global: number; // 治療處置整體評分 (0-5)
    feedback: string;
  };

  // Section 7: 照會溝通 (Max raw: 8 + 5 global = 13)
  consultation: {
    c1: number; // 照會腎臟科 (0-1)
    c2: number; // 照會 ICU (0-1)
    c3: number; // 照會心臟科 (0-1)
    c4: number; // ISBAR 照會溝通 (0-5)
    global: number; // 照會溝通整體評分 (0-5)
    feedback: string;
  };

  // Section 8: 諮商溝通 (Max raw: 5 + 5 global = 10)
  counseling: {
    co1: number; // 建立關係與確認理解 (0-1)
    co2: number; // 說明危急狀態 (0-1)
    co3: number; // 說明可能原因與診斷邏輯 (0-1)
    co4: number; // 說明治療與後續計畫 (0-1)
    co5: number; // 回應情緒與確認理解 (0-1)
    global: number; // 諮商溝通整體評分 (0-5)
    feedback: string;
  };

  generalFeedback: string;
  totalScore: number; // Calculated overall weighted percentage (0-100)
  caseIdx?: number;
}
