import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

const SCORES_FILE = path.join(process.cwd(), "scores-db.json");

function readScoresFromFile(): any[] {
  try {
    if (fs.existsSync(SCORES_FILE)) {
      const data = fs.readFileSync(SCORES_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading scores file, defaulting to empty:", err);
  }
  return [];
}

function writeScoresToFile(scores: any[]) {
  try {
    fs.writeFileSync(SCORES_FILE, JSON.stringify(scores, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing scores file:", err);
  }
}

// Seed data
const MOCK_HISTORIC_REPORTS = [
  {
    candidateId: "A1",
    candidateName: "史育通",
    candidateHospital: "國泰",
    evaluatorId: "3",
    evaluatorName: "鍾睿元",
    date: "2026-05-20",
    history: { s1: 2, s2: 2, s3: 1, s4: 1, s5: 1, s6: 2, s7: 1, s8: 1, global: 5, feedback: "Excellent eliciting of medications" },
    physical: { p1: 1, p2: 1, p3: 2, p4: 1, p5: 1, global: 3, feedback: "Recognized dehydration state" },
    diagnosis: { d1: 1, d2: 1, d3: 1, d4: 1, d5: 0, feedback: "Good core impression" },
    investigations: { i1: 1, i2: 2, i3: 1, global: 6, feedback: "Properly read peaked T wave" },
    differential: { dd1: 3, dd2: 1, dd3: 1, dd4: 1, global: 3, feedback: "Directly mentioned BRASH, excellent" },
    treatment: { tx1: 1, tx2: 2, tx3: 2, tx4: 3, tx5: 1, global: 4, feedback: "Gave calcium immediately" },
    consultation: { c1: 1, c2: 1, c3: 1, c4: 4, global: 4, feedback: "Adequate ISBAR consultation" },
    counseling: { co1: 1, co2: 1, co3: 1, co4: 1, co5: 1, global: 4, feedback: "Caring patient communication" },
    generalFeedback: "該住院醫師對與多重用藥與高鉀/AKI所引起的 BRASH 症候群具備清晰的核心解構。能迅速指示 Calcium Gluconate 與 Isotonic fluid。醫學與家屬諮商用字誠懇且同理。",
    totalScore: 84.7
  },
  {
    candidateId: "C2",
    candidateName: "盧冠廷",
    candidateHospital: "台大",
    evaluatorId: "1",
    evaluatorName: "曾文斌",
    date: "2026-05-20",
    history: { s1: 2, s2: 2, s3: 2, s4: 2, s5: 1, s6: 2, s7: 2, s8: 2, global: 7, feedback: "Perfect exhaustive history taking" },
    physical: { p1: 2, p2: 2, p3: 2, p4: 2, p5: 2, global: 5, feedback: "Thorough physical check" },
    diagnosis: { d1: 1, d2: 1, d3: 1, d4: 1, d5: 1, feedback: "Exhaustive impression" },
    investigations: { i1: 1, i2: 2, i3: 1, global: 7, feedback: "Read all values precisely" },
    differential: { dd1: 3, dd2: 1, dd3: 1, dd4: 1, global: 4, feedback: "Recognized BRASH syndrome within minutes" },
    treatment: { tx1: 1, tx2: 3, tx3: 2, tx4: 4, tx5: 2, global: 5, feedback: "Immediate synchronized correction" },
    consultation: { c1: 1, c2: 1, c3: 1, c4: 5, global: 5, feedback: "Superb ISBAR with high professionalism" },
    counseling: { co1: 1, co2: 1, co3: 1, co4: 1, co5: 1, global: 5, feedback: "Calmed down simulated family exceptionally well" },
    generalFeedback: "台大盧醫師表現無可挑剔。在新型個別面試的各個行為指標（含ISBAR轉線與家屬極度焦慮安撫）表現完美，思路極有條理，已具備獨立專科急診主治與高危臨床整合能力！",
    totalScore: 97.2
  },
  {
    candidateId: "D1",
    candidateName: "李宛蒨",
    candidateHospital: "國泰",
    evaluatorId: "4",
    evaluatorName: "張昱",
    date: "2026-05-20",
    history: { s1: 1, s2: 1, s3: 1, s4: 1, s5: 1, s6: 1, s7: 1, s8: 1, global: 4, feedback: "Needs systemic drug reconciliation" },
    physical: { p1: 1, p2: 1, p3: 1, p4: 1, p5: 1, global: 3, feedback: "P.E. was acceptable but forgot skin turgor" },
    diagnosis: { d1: 1, d2: 1, d3: 1, d4: 0, d5: 1, feedback: "ACS prioritized" },
    investigations: { i1: 1, i2: 1, i3: 1, global: 4, feedback: "Read peaked T late" },
    differential: { dd1: 0, dd2: 1, dd3: 1, dd4: 1, global: 2, feedback: "Missed the BRASH path mechanism" },
    treatment: { tx1: 1, tx2: 1, tx3: 1, tx4: 2, tx5: 1, global: 2, feedback: "Focus was split, prioritized dialysis late" },
    consultation: { c1: 1, c2: 1, c3: 0, c4: 2, global: 2, feedback: "Failed to brief on drug interactions" },
    counseling: { co1: 1, co2: 1, co3: 0, co4: 1, co5: 0, global: 2, feedback: "Missed family understanding dual check" },
    generalFeedback: "李醫師在一般危急慢心跳與ACS排除上能維持正確防線。然而對於脫水、AKI與房室結阻隔劑引起的協同 BRASH 症候群病理惡性循環理解稍嫌零散。作降鉀治療時忘記優先給鈣。需多加溫習本次教材之臨床機轉！",
    totalScore: 61.3
  }
];

// Scores Endpoints
app.get("/api/scores", (req, res) => {
  let scores = readScoresFromFile();
  res.json({ success: true, scores });
});

app.post("/api/scores", (req, res) => {
  try {
    const newScore = req.body;
    if (!newScore || !newScore.candidateId || !newScore.evaluatorId) {
      return res.status(400).json({ success: false, error: "Invalid score card data" });
    }

    let scores = readScoresFromFile();

    const existingIdx = scores.findIndex(
      (s: any) => s.candidateId === newScore.candidateId && 
                  s.evaluatorId === newScore.evaluatorId &&
                  (s.caseIdx === newScore.caseIdx || (!s.caseIdx && !newScore.caseIdx))
    );

    if (existingIdx >= 0) {
      scores[existingIdx] = newScore;
    } else {
      scores.push(newScore);
    }

    writeScoresToFile(scores);
    res.json({ success: true, scores });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

let scenarioVisibility = {
  isHistoryRevealed: false,
  isLabsRevealed: false,
  isCxrRevealed: false,
  isBrashRevealed: false,
  isEcgRevealed: false,
};

app.get("/api/scenario-visibility", (req, res) => {
  res.json({ success: true, visibility: scenarioVisibility });
});

app.post("/api/scenario-visibility", (req, res) => {
  try {
    const { isHistoryRevealed, isLabsRevealed, isCxrRevealed, isBrashRevealed, isEcgRevealed } = req.body;
    if (typeof isHistoryRevealed === "boolean") scenarioVisibility.isHistoryRevealed = isHistoryRevealed;
    if (typeof isLabsRevealed === "boolean") scenarioVisibility.isLabsRevealed = isLabsRevealed;
    if (typeof isCxrRevealed === "boolean") scenarioVisibility.isCxrRevealed = isCxrRevealed;
    if (typeof isBrashRevealed === "boolean") scenarioVisibility.isBrashRevealed = isBrashRevealed;
    if (typeof isEcgRevealed === "boolean") scenarioVisibility.isEcgRevealed = isEcgRevealed;

    res.json({ success: true, visibility: scenarioVisibility });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/scores/clear", (req, res) => {
  try {
    writeScoresToFile([]);
    res.json({ success: true, scores: [] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Lazy-loaded Gemini AI client to prevent crash if key is missing on start
let generativeAiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!generativeAiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is not configured. Clean feedback can still be graded locally without API calling.");
    }
    generativeAiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return generativeAiClient;
}

// Endpoint to generate professional traditional Chinese mentoring feedback using Gemini 3.5 Flash
app.post("/api/evaluations/ai-feedback", async (req, res) => {
  try {
    const { 
      candidateName, 
      hospital, 
      checklistState, 
      overallPercentage,
      examinerNotes 
    } = req.body;

    const fallbackResponse = `[模擬評鑑回饋] ${candidateName} 醫師於本次急性 BRASH Syndrome 案例模擬中完成評分，加權評分約為 ${overallPercentage}%。請依據下方複選核對清單與導師建議進行臨床反思與改進。`;

    // Attempt to invoke Gemini
    let client;
    try {
      client = getGeminiClient();
    } catch (err: any) {
      // If no key, return styled mock report to ensure continuous offline experience on free trial
      return res.json({
        success: true,
        feedback: `${fallbackResponse}\n\n⚠️ 系統提示：伺服器未檢測到 GEMINI_API_KEY。此為系統在缺乏金鑰時所代發之標準回饋：\n1. 病史：已初步了解病患多重用藥（AV 阻滯劑與利尿劑）之關鍵，但需更重視與家屬的治療處置對談。\n2. 身體檢查：能確實核查脫水、黏膜偏乾及微血管充盈（CRT），下一步應主動聯絡後線科別照會。\n3. 機械性背誦常規降鉀，在合併心搏過慢時，應優先考量靜脈 Calcium 保護心肌以免惡化。`
      });
    }

    const systemInstruction = `你是一位台灣急診醫學部教學計劃主持人(Teaching Program Director)。
專門用來評鑑住院醫師（或申請入職之醫師）在臨床面試模擬情境中的表現，並撰寫客觀、建設性的繁體中文「臨床培育導師評語(Feedback Report)」。

案例生理情境：81歲女性、低血壓(90/50)、心搏過慢(35下/分)、體液偏乾、服用多種AV nodal block與ACEI/ARB藥物，最終診斷為 BRASH Syndrome。
你要撰寫一篇大約 250 - 350 字的專業導師報告，口頭親切且字字珠璣(專業臨床名詞)，包含：
1. 臨床優勢分析 (基於考生能達成的 checklist)。
2. 臨床盲點探討。
3. 急診專科臨床指導：例如提醒「BRASH病因在於脫水與藥物蓄積，治療不應僅一昧機械性洗腎，更應立刻給予 Calcium Gluconate / Isotonic Fluid 並停用 AV blocker 加強灌流」。`;

    const prompt = `請評量以下考生表現並撰寫報告：
考生姓名: ${candidateName} (${hospital}急診住院醫師)
本次綜合評分成績: ${overallPercentage}%
考官現場隨手筆記: "${examinerNotes || "表現規矩且積極，細節可更有組織"}"

考生表現狀態 (Checklist Check-off)：
- 病史詢問完成度: ${checklistState.historyChecked} / 8 項
- 身體診察完成度: ${checklistState.physicalChecked} / 5 項
- 主動安排之檢查項目: ${checklistState.investigationsChecked} / 3 項
- 治療處真與降血鉀掌握度: ${checklistState.treatmentChecked} / 5 項

請依據上述數據與考官隨手筆記，為他生成一份格式雅緻的繁體中文評核小語，必須包含「優勢評鑑」、「待補足臨床盲點」與「專科臨床教學（特別提及 Calcium 保護心肌與 BRASH 惡性循環機制）」三部分。`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    const aiText = response.text || fallbackResponse;

    res.json({
      success: true,
      feedback: aiText
    });

  } catch (error: any) {
    console.error("Gemini API Feedback Error:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message || "產生 AI 評核回饋時發生錯誤" 
    });
  }
});

// Serve static assets / handle Vite middlewares
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`EM Resident Interview Server available on port ${PORT}`);
  });
}

setupServer();
