import { Participant, Instructor, TimetableSlot } from "../types";

export const CANDIDATES: Participant[] = [
  { id: "A1", name: "史育通", hospital: "國泰", group: "A", roleCode: "A1" },
  { id: "A2", name: "陳仲昫", hospital: "台大", group: "A", roleCode: "A2" },
  { id: "B1", name: "永曜嘉", hospital: "國泰", group: "B", roleCode: "B1" },
  { id: "B2", name: "陳泰源", hospital: "台大", group: "B", roleCode: "B2" },
  { id: "C1", name: "徐詠泰", hospital: "國泰", group: "C", roleCode: "C1" },
  { id: "C2", name: "盧冠廷", hospital: "台大", group: "C", roleCode: "C2" },
  { id: "D1", name: "李宛蒨", hospital: "國泰", group: "D", roleCode: "D1" },
  { id: "D2", name: "施柏鈞", hospital: "台大", group: "D", roleCode: "D2" },
  { id: "E1", name: "李紘名", hospital: "馬偕", group: "E", roleCode: "E1" },
  { id: "E2", name: "蔡仁傑", hospital: "台大", group: "E", roleCode: "E2" },
];

export const INSTRUCTORS: Instructor[] = [
  { id: 1, name: "曾文斌", hospital: "臺大醫學院附設醫院", title: "急診醫學部 副教學計劃主持人" },
  { id: 2, name: "蘇培易", hospital: "臺大醫學院附設醫院", title: "急診醫學部 主治醫師" },
  { id: 3, name: "鍾睿元", hospital: "台北國泰綜合醫院", title: "急診醫學部 教學計劃主持人" },
  { id: 4, name: "張昱", hospital: "台北國泰綜合醫院", title: "急診醫學部 主治醫師" },
];

export const TIMETABLE: TimetableSlot[] = [
  { time: "08:30~09:00", room1: "預備 / 報到", room2: "預備 / 報到", type: "prep" },
  { time: "09:00~09:15", room1: "A1 與 B1 練習", room2: "C2 與 D2 練習 [E1 練習]", type: "session" },
  { time: "09:15~09:30", room1: "A2 與 B2 練習", room2: "師 2(C1) 督導考 [D1 與 E2 練習]", type: "session" },
  { time: "09:30~09:45", room1: "師 4(A1) 與 師 3(B1) 正式考", room2: "C2 與 D2 練習 [師 2(E1) 督導考]", type: "session" },
  { time: "09:45~10:00", room1: "A2 與 B2 練習", room2: "C1 與 E2 練習 [師 1(D1) 督導考]", type: "session" },
  { time: "10:00~10:20", room1: "中場休息 / 交流時間", room2: "中場休息 / 交流時間", type: "break" },
  { time: "10:20~10:35", room1: "C1 與 D1 練習", room2: "師 1(C2) 督導考 [A1 與 B2 練習]", type: "session" },
  { time: "10:35~10:50", room1: "師 3(A2) 與 師 2(B2) 正式考", room2: "C1 與 D1 練習", type: "session" },
  { time: "10:50~11:05", room1: "A1 與 B1 練習", room2: "師 4(D2) 督導考 [C2 與 E1 練習]", type: "session" },
  { time: "11:05~11:20", room1: "A2 與 B2 練習", room2: "師 1(E2) 督導考 [C1 與 D2 練習]", type: "session" },
];

export const CASE_SCENARIOS = [
  {
    id: "brash-syndrome",
    title: "2026住院醫師聯合面試訓練",
    topic: "BRASH Syndrome (心搏過慢、高血鉀、AKI與藥物引起之臨床路徑)",
    author: "鍾睿元",
    patientProfile: {
      ageSex: "81 歲女性",
      chiefComplaint: "胸痛及全身無力",
      vitals: {
        bp: "90/50 mmHg",
        hr: "35 /min",
        temp: "36.3 °C",
        rr: "20 /min",
        spo2: "95% (Room Air)",
        gcs: "E4V5M6 (虛弱、反應稍慢)",
      },
      presentIllness: "一位 81 歲女性，昨天早上開始胸痛及全身無力，今日症狀加劇被家人帶來急診。病人覺得頭暈、快昏倒，但沒有真正失去意識。胸痛為悶痛，無明顯放射至背部或左手，沒有冒冷汗。最近三天食慾較差，尿量變少。沒有發燒、咳嗽或腹瀉。",
      pastHistory: [
        "心臟衰竭 (CHF)",
        "糖尿病 (DM)",
        "高血壓 (HTN)",
        "心房顫動 (Atrial fibrillation, Af)",
        "泌尿道感染 (UTI)",
      ],
      medications: [
        "Spironolactone 25 mg 1 粒 QD",
        "Linagliptin 5 mg 1 粒 QD",
        "Amiodarone 200 mg 0.5 粒 QD",
        "Dapagliflozin 10 mg 1 粒 QD",
        "Sacubitril 49 mg/valsartan 51 mg 1 粒 BID",
        "Pregabalin 75 mg 1 粒 TID",
        "Sennoside 2 粒 HSPRN",
        "Famotidine 20 mg 1 粒 QD",
        "Bisoprolol 1.25 mg 1 粒 QOD",
        "Mexiletine 100 mg 1 粒 QD",
        "Furosemide 20mg 1 粒 QD",
      ],
      candidatePrompt: {
        intro: "現在開始有十五分鐘，模擬看診一位急診病人，請開始你跟這位病人的問診互動，所有情境的互動過程考官會給你相對應的回應，注意互動的完整性、必要性、順序、時間的掌握等都會納入評分的參考，請盡量進入模擬的情境中忠實呈現你跟病人互動的過程，模擬包括環境中所有可能用到的設備或資源。",
        caseInfo: "一位 81 歲女性病人來急診，主訴胸痛及全身無力。檢傷生命徵象為：血壓：90/50 mmHg；心跳：每分鐘 35 下；體溫：36.3°C；呼吸：每分鐘 20 下；血氧濃度：SpO₂ 95%，room air；意識狀態：E4V5M6，但顯得虛弱、反應稍慢，請您進行重點式病史詢問、身體檢查，並提出初步診斷與處置。",
        tasks: [
          "一、請問病史，考官會模擬回答。",
          "二、請說出您想要做的身體診察，考官會模擬回答。",
          "三、請提出您的鑑別診斷。",
          "四、請提出您要安排的檢查、檢驗，並說明原因。",
          "五、綜合以上資訊，提出最有可能的診斷，並說明原因。",
          "六、請針對此病人的病情進行醫療處置。",
          "七、請進行專科照會。",
          "八、請進行病情解釋。"
        ]
      }
    },
    labReport: {
      wbc: { val: "8.5", unit: "K/uL", ref: "4.0–10.0" },
      hb: { val: "12.8", unit: "g/dL", ref: "女：12.0–16.0" },
      plt: { val: "180", unit: "K/uL", ref: "150–400" },
      na: { val: "134", unit: "mmol/L", ref: "135–145" },
      k: { val: "6.8", unit: "mmol/L", ref: "3.5–5.0", isCritical: true, note: "高血鉀 (Hyperkalemia)" },
      bun: { val: "72", unit: "mg/dL", ref: "7–20", isCritical: true },
      creatinine: { val: "2.8", unit: "mg/dL", ref: "女：0.5–1.1", isCritical: true, note: "急性腎損傷（AKI）/ 腎衰竭" },
      glucose: { val: "210", unit: "mg/dL", ref: "空腹 70-100；通常 <200" },
      troponint: { val: "10", unit: "ng/L", ref: "<14 (Normal)" },
      vbgPh: { val: "7.28", unit: "", ref: "7.32–7.42", isCritical: true },
      hco3: { val: "18", unit: "mmol/L", ref: "22–26", isCritical: true },
      lactate: { val: "2.8", unit: "mmol/L", ref: "0.5–2.0" },
    },
    clinicalLogic: {
      definition: "BRASH Syndrome 是由 5 個要素所組成的惡性循環：Bradycardia（心搏過慢）、Renal failure（腎衰竭）、AV nodal blockers（房室結阻滯劑蓄積）、Shock（休克）、Hyperkalemia（高血鉀）。",
      pathway: [
        { step: 1, title: "誘因：極度脫水 (Dehydration)", desc: "因食慾差與喝水少導致身體脫水、低血容狀態。" },
        { step: 2, title: "腎灌流降低 -> 急性腎損傷 (AKI)", desc: "腎臟血流嚴重不足，估計 Creatinine 上升至 2.8 且尿量急遽變少。" },
        { step: 3, title: "鉀離子清除率降低 -> 高血鉀 (Hyperkalemia)", desc: "腎臟排鉀功能惡化，血鉀爬升至 6.8 mmol/L。" },
        { step: 4, title: "藥物蓄積高濃度 (AV-nodal block / BB / ACEI / ARB)", desc: "平常服用的安定藥物（如 Bisoprolol, Sacubitril/Valsartan, Spironolactone）因腎臟衰竭在體內迅速蓄積，藥物效應放大數倍。" },
        { step: 5, title: "加劇心室房阻滯與休克 (Severe Bradycardia & Shock)", desc: "高血鉀協同蓄積的 AV 結阻斷劑加劇心搏過慢（HR 35下/分）並導致嚴重低灌流、低血壓（90/50 mmHg），進一步拉低腎臟灌流，形成死結。" }
      ]
    }
  },
  {
    id: "uterine-rupture",
    title: "2026住院醫師聯合面試訓練 (Case 2)",
    topic: "Uterine Rupture (子宮破裂、失血性休克、敗血症)",
    author: "鍾睿元",
    patientProfile: {
      ageSex: "35 歲產婦 (G2P1A0, 懷孕 27 週)",
      chiefComplaint: "下腹劇痛與發燒",
      vitals: {
        bp: "80/40 mmHg",
        hr: "120 /min",
        temp: "38.7 °C",
        rr: "24 /min",
        spo2: "95% (Room Air)",
        gcs: "E3V4M5 (嗜睡、反應遲鈍)",
      },
      presentIllness: "一位 35 歲產婦，懷孕 27 週，今天清晨開始出現下腹劇烈疼痛（VAS 7~8 分），接著出現畏寒發燒（最高 38.9°C）。病人坐在輪椅上被送入急診。目前無陰道出血，但自覺腹部非常疼痛且子宮收縮感不規律。過去曾接受過兩次子宮肌瘤切除手術。",
      pastHistory: [
        "曾接受兩次子宮肌瘤切除手術 (Myomectomy)",
        "慢性貧血 (Hb 平均約 7.5)",
        "初產婦為自然產，無併發症",
      ],
      medications: ["無固定服用藥物"],
      medicationClue: "無藥物過敏史。家族史無特殊疾病。近一年無出國紀錄。",
      candidatePrompt: {
        intro: "現在開始有十五分鐘，模擬看診一位急診病人，請開始你跟這位病人的問診互動，所有情境的互動過程考官會給你相對應的回應，注意互動的完整性、必要性、順序、時間的掌握等都會納入評分的參考，請盡量進入模擬的情境中忠實呈現你跟病人互動的過程，模擬包括環境中所有可能用到的設備或資源。",
        caseInfo: "一位 35 歲產婦，懷孕 27 週，主訴腹痛（VAS 7~8 分）與發燒來急診。檢傷生命徵象：血壓 80/40 mmHg、心跳 120 bpm、呼吸 24/min、體溫 38.7°C、SpO2 95% (room air)；意識呈現嗜睡狀態。請您進行重點式病史詢問、身體檢查，並提出初步診斷與處置。",
        tasks: [
          "一、請問病史，考官會模擬回答。",
          "二、請說出您想要做的身體診察，考官會模擬回答。",
          "三、請提出您的鑑別診斷。",
          "四、請提出您要安排的檢查、檢驗，並說明原因。",
          "五、綜合以上資訊，提出最有可能的診斷，並說明原因。",
          "六、突發狀況：病人突然失去意識，無呼吸、無脈搏，現場有兩名護理師及一名 PGY，請進行處置。",
          "七、請進行病情解釋。"
        ]
      }
    },
    labReport: {
      hb: { val: "4.0", unit: "g/dL", ref: "12-16", isCritical: true, note: "嚴重貧血/急性出血" },
      wbc: { val: "20,000", unit: "/uL", ref: "4000-10000", isCritical: true, note: "白血球過高 (Leukocytosis)" },
      crp: { val: "20", unit: "mg/dL", ref: "<0.5", isCritical: true },
      lactate: { val: "7.0", unit: "mmol/L", ref: "0.5-2.0", isCritical: true, note: "嚴重組織灌流不足/酸中毒" },
      plt: { val: "正常", unit: "", ref: "" },
      ptPtt: { val: "輕微延長", unit: "", ref: "" },
      ua: { val: "正常", unit: "", ref: "" },
      bloodType: { val: "O 型，Rh+", unit: "", ref: "" },
      ultrasound: { val: "腹腔內大量游離液體、胎兒心跳微弱、子宮輪廓不清", unit: "", isCritical: true, note: "疑似子宮破裂" }
    },
    clinicalLogic: {
      definition: "子宮破裂 (Uterine Rupture) 是產科最危急的併發症之一。本案例結合了失血性休克（出血入腹腔）與敗血性休克（可能併發感染）的表現。需立即啟動輸血、手術準備，若發展至心肺停止，則需啟動 Perimortem C-section (PMCS)。",
      pathway: [
        { step: 1, title: "病史風險", desc: "病人曾接受兩次子宮肌瘤切除手術(myomectomy)，導致子宮壁有舊傷口薄弱區。" },
        { step: 2, title: "急性破裂與出血", desc: "下腹劇痛預示子宮破裂，大量血液流入腹腔導致 Hb 驟降至 4.0，產生低血容性休克。" },
        { step: 3, title: "感染與發燒", desc: "同時伴隨發燒與 WBC 飆高，暗示可能存在敗血症或腹膜炎，兩者機轉並存 (Mixed Shock)。" },
        { step: 4, title: "胎兒窘迫", desc: "母體休克直接導致胎盤灌流不足，超音波顯示胎兒心跳微弱。" },
        { step: 5, title: "心肺停止 (Cardiac Arrest)", desc: "因急性嚴重失血與酸中毒 (Lactate 7.0)，病人突然意識喪失，需立即進行 CPR、LUD 並考慮 PMCS。" }
      ]
    }
  }
];

export const CASE_SCENARIO = CASE_SCENARIOS[0];
