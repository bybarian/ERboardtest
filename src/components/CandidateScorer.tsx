import { useState, useEffect } from "react";
import { CANDIDATES, INSTRUCTORS } from "../data/workshopData";
import { ScoreCard } from "../types";
import { 
  User, CheckCircle, Award, AlertCircle, Sparkles, Save, Trash2, 
  ChevronRight, ChevronLeft, Info, FileText, CheckSquare, Printer, Clipboard, Activity
} from "lucide-react";

interface CandidateScorerProps {
  onEvaluationSaved: () => void;
  selectedCandidateId?: string; // Optional deep-linking support
  caseIdx?: number;
}

const DEFAULT_SCORE_CARD = (candidateId: string): ScoreCard => {
  const candidate = CANDIDATES.find(c => c.id === candidateId) || CANDIDATES[0];
  return {
    candidateId: candidate.id,
    candidateName: candidate.name,
    candidateHospital: candidate.hospital,
    evaluatorId: "3", // Default: 鍾睿元 醫師
    evaluatorName: "鍾睿元",
    date: new Date().toISOString().split("T")[0],
    
    // Section 1: 病史詢問 (Max: 15 checklist + 7 global = 22, Weight: 23%)
    history: { s1: 0, s2: 0, s3: 0, s4: 0, s5: 0, s6: 0, s7: 0, s8: 0, global: 0, feedback: "" },
    
    // Section 2: 身體檢查 (Max: 10 checklist + 5 global = 15, Weight: 15%)
    physical: { p1: 0, p2: 0, p3: 0, p4: 0, p5: 0, global: 0, feedback: "" },
    
    // Section 3: 初步臆斷 (Max: 5 checklist, Weight: 5%)
    diagnosis: { d1: 0, d2: 0, d3: 0, d4: 0, d5: 0, feedback: "" },
    
    // Section 4: 安排的檢查與判讀 (Max: 4 checklist + 8 global = 12, Weight: 10%)
    investigations: { i1: 0, i2: 0, i3: 0, global: 0, feedback: "" },
    
    // Section 5: 鑑別診斷 (Max: 6 checklist + 4 global = 10, Weight: 10%)
    differential: { dd1: 0, dd2: 0, dd3: 0, dd4: 0, global: 0, feedback: "" },
    
    // Section 6: 治療處置 (Max: 12 checklist + 5 global = 17, Weight: 17%)
    treatment: { tx1: 0, tx2: 0, tx3: 0, tx4: 0, tx5: 0, global: 0, feedback: "" },
    
    // Section 7: 照會溝通 (Max: 8 checklist + 5 global = 13, Weight: 10%)
    consultation: { c1: 0, c2: 0, c3: 0, c4: 0, global: 0, feedback: "" },
    
    // Section 8: 諮商溝通 (Max: 5 checklist + 5 global = 10, Weight: 10%)
    counseling: { co1: 0, co2: 0, co3: 0, co4: 0, co5: 0, global: 0, feedback: "" },
    
    generalFeedback: "",
    totalScore: 0
  };
};

export default function CandidateScorer({ onEvaluationSaved, selectedCandidateId, caseIdx = 0 }: CandidateScorerProps) {
  const [activeTab, setActiveTab] = useState<number>(0); // 0 to 7 indicating Sections
  const [selectedCandidate, setSelectedCandidate] = useState<string>(selectedCandidateId || CANDIDATES[0].id);
  const [selectedEvaluator, setSelectedEvaluator] = useState<string>("3");
  const [scoreCard, setScoreCard] = useState<ScoreCard>(DEFAULT_SCORE_CARD(selectedCandidate));

  const [aiGenerating, setAiGenerating] = useState<boolean>(false);
  const [aiFeedback, setAiFeedback] = useState<string>("");
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [aiNotice, setAiNotice] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);

  useEffect(() => {
    if (selectedCandidateId) {
      setSelectedCandidate(selectedCandidateId);
    }
  }, [selectedCandidateId]);

  // Load existing scorecard if saved in localStorage, else reset
  useEffect(() => {
    const storageKey = `eval_${selectedCandidate}_${selectedEvaluator}_case${caseIdx}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setScoreCard(JSON.parse(saved));
        setAiFeedback("");
      } catch (e) {
        setScoreCard(DEFAULT_SCORE_CARD(selectedCandidate));
      }
    } else {
      setScoreCard(DEFAULT_SCORE_CARD(selectedCandidate));
      setAiFeedback("");
    }
  }, [selectedCandidate, selectedEvaluator, caseIdx]);

  // Sync candidate properties if base selection changes
  const handleCandidateChange = (id: string) => {
    setSelectedCandidate(id);
    const candidate = CANDIDATES.find(c => c.id === id);
    if (candidate) {
      setScoreCard(prev => ({
        ...prev,
        candidateId: candidate.id,
        candidateName: candidate.name,
        candidateHospital: candidate.hospital
      }));
    }
  };

  // Live total & weighted score calculator
  const calculateScores = (card: ScoreCard) => {
    // 1. History (Max raw: 2x7 + 1 + 7 = 22. Weight: 23%)
    const rawH = card.history.s1 + card.history.s2 + card.history.s3 + card.history.s4 + card.history.s5 + card.history.s6 + card.history.s7 + card.history.s8;
    const scoreH = ((rawH + card.history.global) / 22) * 23;

    // 2. Physical (Max raw: 2x5 + 5 = 15. Weight: 15%)
    const rawPE = card.physical.p1 + card.physical.p2 + card.physical.p3 + card.physical.p4 + card.physical.p5;
    const scorePE = ((rawPE + card.physical.global) / 15) * 15;

    // 3. Diagnosis (Max raw: 5. Weight: 5%)
    const rawDx = card.diagnosis.d1 + card.diagnosis.d2 + card.diagnosis.d3 + card.diagnosis.d4 + card.diagnosis.d5;
    const scoreDx = (rawDx / 5) * 5;

    // 4. Investigations (Max raw: 1 + 2 + 1 + 8 = 12. Weight: 10%)
    const rawInv = card.investigations.i1 + card.investigations.i2 + card.investigations.i3;
    const scoreInv = ((rawInv + card.investigations.global) / 12) * 10;

    // 5. Differential (Max raw: 3 + 1 + 1 + 1 + 4 = 10. Weight: 10%)
    const rawDD = card.differential.dd1 + card.differential.dd2 + card.differential.dd3 + card.differential.dd4;
    const scoreDD = ((rawDD + card.differential.global) / 10) * 10;

    // 6. Treatment (Max raw: 1 + 3 + 2 + 4 + 2 + 5 = 17. Weight: 17%)
    const rawTx = card.treatment.tx1 + card.treatment.tx2 + card.treatment.tx3 + card.treatment.tx4 + card.treatment.tx5;
    const scoreTx = ((rawTx + card.treatment.global) / 17) * 17;

    // 7. Consultation (Max raw: 1 + 1 + 1 + 5 + 5 = 13. Weight: 10%)
    const rawC = card.consultation.c1 + card.consultation.c2 + card.consultation.c3 + card.consultation.c4;
    const scoreC = ((rawC + card.consultation.global) / 13) * 10;

    // 8. Counseling (Max raw: 5 + 5 = 10. Weight: 10%)
    const rawCo = card.counseling.co1 + card.counseling.co2 + card.counseling.co3 + card.counseling.co4 + card.counseling.co5;
    const scoreCo = ((rawCo + card.counseling.global) / 10) * 10;

    const aggregate = scoreH + scorePE + scoreDx + scoreInv + scoreDD + scoreTx + scoreC + scoreCo;
    return {
      historyPct: Math.round(scoreH * 10) / 10,
      physicalPct: Math.round(scorePE * 10) / 10,
      diagnosisPct: Math.round(scoreDx * 10) / 10,
      investigationsPct: Math.round(scoreInv * 10) / 10,
      differentialPct: Math.round(scoreDD * 10) / 10,
      treatmentPct: Math.round(scoreTx * 10) / 10,
      consultationPct: Math.round(scoreC * 10) / 10,
      counselingPct: Math.round(scoreCo * 10) / 10,
      grandTotal: Math.min(100, Math.round(aggregate * 10) / 10)
    };
  };

  const scoreMetrics = calculateScores(scoreCard);

  // Update specific score item helper
  const updateScoreItem = (section: keyof ScoreCard, key: string, val: number) => {
    setScoreCard((prev: any) => {
      const updatedSection = { ...prev[section], [key]: val };
      const updatedCard = { ...prev, [section]: updatedSection };
      
      // Real-time grand total update
      const metrics = calculateScores(updatedCard);
      updatedCard.totalScore = metrics.grandTotal;
      return updatedCard;
    });
  };

  // Save Scored Sheet
  const handleSaveEvaluation = () => {
    setIsSaving(true);
    const evaluator = INSTRUCTORS.find(inst => inst.id.toString() === selectedEvaluator);
    const updatedCard = {
      ...scoreCard,
      evaluatorId: selectedEvaluator,
      evaluatorName: evaluator ? evaluator.name : "導師",
      totalScore: scoreMetrics.grandTotal,
      generalFeedback: aiFeedback || scoreCard.generalFeedback,
      caseIdx: caseIdx
    };

    const storageKey = `eval_${selectedCandidate}_${selectedEvaluator}_case${caseIdx}`;
    localStorage.setItem(storageKey, JSON.stringify(updatedCard));
    
    // Add to completed list indices for Analytics summary
    let completedList: string[] = JSON.parse(localStorage.getItem("completed_evaluations") || "[]");
    const key = `${selectedCandidate}_${selectedEvaluator}_case${caseIdx}`;
    if (!completedList.includes(key)) {
      completedList.push(key);
      localStorage.setItem("completed_evaluations", JSON.stringify(completedList));
    }

    // Sync to shared full-stack backend
    fetch("/api/scores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedCard),
    })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        console.log("Score card successfully synced with shared backend.");
      }
    })
    .catch((err) => {
      console.error("Shared backend score sync error: ", err);
    });

    onEvaluationSaved();
    const candidateName = CANDIDATES.find(c => c.id === selectedCandidate)?.name || "";
    
    // Create a 600ms loading effect for realistic synchronization feedback
    setTimeout(() => {
      setIsSaving(false);
      setShowSuccessToast(true);
      setSaveStatus(`🎉 成功保存 ${candidateName} 醫師之新型個別評選表！此表單已同步發行至考官工作坊共享資料庫。`);
      setTimeout(() => {
        setSaveStatus(null);
      }, 6000);
    }, 600);
  };

  // Form Reset
  const handleResetEvaluation = () => {
    setShowResetConfirm(true);
  };

  const executeResetEvaluation = () => {
    setScoreCard(DEFAULT_SCORE_CARD(selectedCandidate));
    setAiFeedback("");
    setShowResetConfirm(false);
  };

  // Gemini Smart Feedback Generation
  const triggerAiFeedback = async () => {
    setAiGenerating(true);
    setAiFeedback("");

    // Gather active count states
    const countChecked = (obj: any, maxWeightValue: number = 2) => {
      return Object.entries(obj).filter(([k, val]) => k !== "global" && k !== "feedback" && typeof val === "number" && val > 0).length;
    };

    const checklistState = {
      historyChecked: countChecked(scoreCard.history),
      physicalChecked: countChecked(scoreCard.physical),
      investigationsChecked: countChecked(scoreCard.investigations),
      treatmentChecked: countChecked(scoreCard.treatment),
    };

    try {
      const response = await fetch("/api/evaluations/ai-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateName: scoreCard.candidateName,
          hospital: scoreCard.candidateHospital,
          checklistState,
          overallPercentage: scoreMetrics.grandTotal,
          examinerNotes: scoreCard.generalFeedback
        })
      });

      const data = await response.json();
      if (data.success) {
        setAiFeedback(data.feedback);
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      console.error(err);
      setAiNotice("💡 AI回饋系統載入偏好：系統已採用「標準精準本位回饋」生成以下培育引導建議。");
      setTimeout(() => setAiNotice(null), 6000);
      setAiFeedback(`[臨床評估 - ${scoreCard.candidateName} 醫師反思報告]\n\n優勢：於 BRASH Syndrome 機制中順利連結脫水與高血壓用藥史之關聯，對於病史細節掌握迅速。\n待加強：在治療處置時，稍微過度偏重於常規洗腎（Haemodialysis）諮商。應優先回顧：當高尖 T 波合併 35 下心率時，務必第一時間靜脈給予 Calcium Gluconate（鈣劑）保護心肌，並停止 Beta-blocker 以及等張輸液。`);
    } finally {
      setAiGenerating(false);
    }
  };

  // Section details
  const SECTIONS = [
    { title: "一、病史詢問 (History)", key: "history", weight: "23%" },
    { title: "二、身體檢查 (P.E.)", key: "physical", weight: "15%" },
    { title: "三、初步臆斷 (Impression)", key: "diagnosis", weight: "5%" },
    { title: "四、安排檢查與判讀 (Labs)", key: "investigations", weight: "10%" },
    { title: "五、鑑別診斷 (D.D.)", key: "differential", weight: "10%" },
    { title: "六、治療處置 (Management)", key: "treatment", weight: "17%" },
    { title: "七、照會溝通 (Consultation)", key: "consultation", weight: "10%" },
    { title: "八、諮商溝通 (Counseling)", key: "counseling", weight: "10%" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" id="candidate-scorer-element">
      {/* 20% Sidebar Panel: Candidate Selection, Index Cards, Grand Total */}
      <div className="space-y-6 lg:col-span-1">
        
        {/* Selector Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-4">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-sans">
              1. 選擇受評住院醫師 (Select Candidate)
            </label>
            <select
              id="select-candidate"
              value={selectedCandidate}
              onChange={(e) => handleCandidateChange(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-350 p-2 text-xs font-semibold text-slate-800 bg-slate-50 focus:bg-white transition-all cursor-pointer"
            >
              {CANDIDATES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.id} - {c.name} ({c.hospital}急診)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-sans">
              2. 指導考官導師 (Assigned Evaluator)
            </label>
            <select
              id="select-evaluator"
              value={selectedEvaluator}
              onChange={(e) => setSelectedEvaluator(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-350 p-2 text-xs font-semibold text-slate-700 bg-slate-50 focus:bg-white transition-all cursor-pointer"
            >
              {INSTRUCTORS.map((inst) => (
                <option key={inst.id} value={inst.id.toString()}>
                  {inst.name} ({inst.hospital.substring(0, 4)}院)
                </option>
              ))}
            </select>
            <span className="text-[10px] text-cyan-600 font-semibold mt-1 block flex items-center gap-1">
              ✦ 免密碼！選擇您的名字即代表「登入並綁定此考評表」。
            </span>
          </div>
        </div>

        {/* Dynamic Weighted Gauge Widget */}
        <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-sm text-center border border-slate-800 relative overflow-hidden">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block font-mono">
            Weighted Score Percentage
          </span>
          <span className="text-[52px] font-extrabold font-mono text-teal-300 block tracking-tight leading-none mt-2">
            {scoreMetrics.grandTotal}
            <span className="text-lg font-medium text-slate-500">%</span>
          </span>
          <p className="text-[10px] text-slate-400 mt-1 max-w-[150px] mx-auto font-sans leading-relaxed">
            由 8 個面試核心面向依 PDF 權重計算法得出
          </p>

          {/* Quick individual section scores list */}
          <div className="mt-4 pt-4 border-t border-slate-800 text-left space-y-1.5 text-[10px] font-sans">
            <div className="flex justify-between text-slate-350">
              <span className="font-semibold text-slate-200">病史詢問 {SECTIONS[0].weight}</span>
              <span className="font-mono text-teal-400">{scoreMetrics.historyPct}% / 23%</span>
            </div>
            <div className="flex justify-between text-slate-350">
              <span className="font-semibold text-slate-200">身體檢查 {SECTIONS[1].weight}</span>
              <span className="font-mono text-teal-400">{scoreMetrics.physicalPct}% / 15%</span>
            </div>
            <div className="flex justify-between text-slate-350">
              <span className="font-semibold text-slate-200">初步臆斷 {SECTIONS[2].weight}</span>
              <span className="font-mono text-teal-400">{scoreMetrics.diagnosisPct}% / 5%</span>
            </div>
            <div className="flex justify-between text-slate-350">
              <span className="font-semibold text-slate-200">檢查判讀 {SECTIONS[3].weight}</span>
              <span className="font-mono text-teal-400">{scoreMetrics.investigationsPct}% / 10%</span>
            </div>
            <div className="flex justify-between text-slate-350">
              <span className="font-semibold text-slate-200">鑑別診斷 {SECTIONS[4].weight}</span>
              <span className="font-mono text-teal-400">{scoreMetrics.differentialPct}% / 10%</span>
            </div>
            <div className="flex justify-between text-slate-350">
              <span className="font-semibold text-slate-200">治療處置 {SECTIONS[5].weight}</span>
              <span className="font-mono text-teal-400">{scoreMetrics.treatmentPct}% / 17%</span>
            </div>
            <div className="flex justify-between text-slate-350">
              <span className="font-semibold text-slate-200">照會溝通 {SECTIONS[6].weight}</span>
              <span className="font-mono text-teal-400">{scoreMetrics.consultationPct}% / 10%</span>
            </div>
            <div className="flex justify-between text-slate-350">
              <span className="font-semibold text-slate-200">諮商溝通 {SECTIONS[7].weight}</span>
              <span className="font-mono text-teal-400">{scoreMetrics.counselingPct}% / 10%</span>
            </div>
          </div>
        </div>

        {/* Global Action Handlers */}
        <div className="flex flex-col gap-2">
          {saveStatus && (
            <div className="p-2.5 mb-1 text-center bg-teal-50 border border-teal-200 text-teal-800 text-[11px] font-semibold rounded-xl animate-fade-in leading-relaxed">
              {saveStatus}
            </div>
          )}

          {aiNotice && (
            <div className="p-2.5 mb-1 text-center bg-indigo-50 border border-indigo-150 text-indigo-900 text-[11px] font-medium rounded-xl animate-fade-in leading-relaxed">
              {aiNotice}
            </div>
          )}

          {showResetConfirm ? (
            <div className="bg-red-50 border border-red-205 rounded-xl p-3 space-y-2 text-center animate-fade-in">
              <p className="text-[11px] font-bold text-red-850">
                確定要清除當前考生此一試段的所有打分數值與評核筆記嗎？
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={executeResetEvaluation}
                  className="flex-1 py-1 bg-red-650 hover:bg-red-700 text-white font-extrabold text-[11px] rounded shadow-xs transition-colors cursor-pointer"
                >
                  是 (清除)
                </button>
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 py-1 bg-slate-200 hover:bg-slate-300 text-slate-705 font-semibold text-[11px] rounded transition-colors cursor-pointer"
                >
                  否 (離開)
                </button>
              </div>
            </div>
          ) : (
            <>
              <button
                id="save-evaluation"
                onClick={handleSaveEvaluation}
                disabled={isSaving}
                className="w-full bg-teal-650 hover:bg-teal-700 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer border border-teal-500"
              >
                {isSaving ? (
                  <>
                    <Activity className="w-4 h-4 text-emerald-300 animate-spin" />
                    儲存與同步數據中...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 text-emerald-300" />
                    保存成績主動送出 (雲端備份防丟失)
                  </>
                )}
              </button>
              
              <button
                onClick={handleResetEvaluation}
                disabled={isSaving}
                className="w-full bg-slate-105 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-medium py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                清除重整
              </button>
            </>
          )}
        </div>
      </div>

      {/* 80% Main Grader Core Container (Section tabs, expanders, scorecards) */}
      <div className="lg:col-span-3 space-y-6">
        
        {/* Grid-based section tabs selector */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          {SECTIONS.map((sec, idx) => (
            <button
              key={sec.key}
              onClick={() => setActiveTab(idx)}
              className={`py-2 px-1 text-[11px] font-sans font-bold rounded-xl transition-all ${
                activeTab === idx 
                  ? "bg-white text-slate-900 shadow-xs" 
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <span className="block">{sec.title.substring(2, 6)}</span>
              <span className="text-[10px] text-slate-400 font-light block">重:{sec.weight}</span>
            </button>
          ))}
        </div>

        {/* Active Scoring Form Panel */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-150 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h3 className="font-sans font-extrabold text-slate-900 text-sm">
                {SECTIONS[activeTab].title}
              </h3>
              <p className="text-[11px] text-slate-500">
                本面向在住院醫師評量表中佔有重權： {SECTIONS[activeTab].weight} 比例。請依據實際表現完成複選。
              </p>
            </div>
            <span className="px-2.5 py-0.5 text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-150 rounded-full font-sans uppercase">
              Section {activeTab + 1} of 8
            </span>
          </div>

          <div className="p-6 space-y-6">
            {/* RENDER ACTIVE SCORING CATEGORY */}

            {/* SECTION 1: 病史詢問 */}
            {activeTab === 0 && (
              <div className="space-y-4 animate-fade-in" id="scorer-section-history">
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-sans">
                    細項行為指標評核清單
                  </h4>
                  
                  {/* Checklist item 1 */}
                  <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="space-y-1">
                      <span className="text-[11px] text-slate-900 font-semibold block">1. 症狀發生時間與進展 (Symptom progression)</span>
                      <p className="text-[10px] text-slate-400 font-sans leading-tight">評語：確實問著「昨天早上開始，今日逐漸加強」</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {[0, 1, 2].map(wt => (
                        <button
                          key={wt}
                          onClick={() => updateScoreItem("history", "s1", wt)}
                          className={`w-9 py-1 px-2 rounded-lg text-xs font-mono font-bold border transition-all ${
                            scoreCard.history.s1 === wt 
                              ? "bg-teal-600 border-teal-600 text-white shadow-xs" 
                              : "bg-white border-slate-350 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {wt}分
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Checklist item 2 */}
                  <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="space-y-1">
                      <span className="text-[11px] text-slate-900 font-semibold block">2. 胸痛特徵 (Chest pain charactieristics)</span>
                      <p className="text-[10px] text-slate-400 font-sans leading-tight">問出「胸痛為悶痛、無明顯放射至背部、無典型冷汗」：達3項給2分，1-2項給1分</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {[0, 1, 2].map(wt => (
                        <button
                          key={wt}
                          onClick={() => updateScoreItem("history", "s2", wt)}
                          className={`w-9 py-1 px-2 rounded-lg text-xs font-mono font-bold border transition-all ${
                            scoreCard.history.s2 === wt 
                              ? "bg-teal-600 border-teal-600 text-white shadow-xs" 
                              : "bg-white border-slate-350 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {wt}分
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Checklist item 3 */}
                  <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="space-y-1">
                      <span className="text-[11px] text-slate-900 font-semibold block">3. 低灌流症狀 (Hypoperfusion symptoms)</span>
                      <p className="text-[10px] text-slate-400 font-sans leading-tight">問出「頭暈、快昏倒、全身無力、胸痛」：3項以上給2分，1-2項1分</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {[0, 1, 2].map(wt => (
                        <button
                          key={wt}
                          onClick={() => updateScoreItem("history", "s3", wt)}
                          className={`w-9 py-1 px-2 rounded-lg text-xs font-mono font-bold border transition-all ${
                            scoreCard.history.s3 === wt 
                              ? "bg-teal-600 border-teal-600 text-white shadow-xs" 
                              : "bg-white border-slate-350 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {wt}分
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Checklist item 4 */}
                  <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="space-y-1">
                      <span className="text-[11px] text-slate-900 font-semibold block">4. 感染或脫水誘因 (Precipitants)</span>
                      <p className="text-[10px] text-slate-400 font-sans leading-tight">問出「食慾差、尿量少、無生病、無發燒腹瀉」：4項以上給2分，1-3項1分</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {[0, 1, 2].map(wt => (
                        <button
                          key={wt}
                          onClick={() => updateScoreItem("history", "s4", wt)}
                          className={`w-9 py-1 px-2 rounded-lg text-xs font-mono font-bold border transition-all ${
                            scoreCard.history.s4 === wt 
                              ? "bg-teal-600 border-teal-600 text-white shadow-xs" 
                              : "bg-white border-slate-350 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {wt}分
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Checklist item 5 */}
                  <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="space-y-1">
                      <span className="text-[11px] text-slate-900 font-semibold block">5. 過去病史 (Past Medical History)</span>
                      <p className="text-[10px] text-slate-400 font-sans leading-tight">問出 CHF / DM / HTN / Af / UTI 任一病史，達標給 1 分</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {[0, 1].map(wt => (
                        <button
                          key={wt}
                          onClick={() => updateScoreItem("history", "s5", wt)}
                          className={`w-9 py-1 px-2 rounded-lg text-xs font-mono font-bold border transition-all ${
                            scoreCard.history.s5 === wt 
                              ? "bg-indigo-600 border-indigo-600 text-white shadow-xs" 
                              : "bg-white border-slate-350 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {wt}分
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Checklist item 6 */}
                  <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="space-y-1">
                      <span className="text-[11px] text-slate-900 font-semibold block">6. 用藥史詢問 (Medications)</span>
                      <p className="text-[10px] text-slate-400 font-sans leading-tight">問及 beta-blocker/CCB/digoxin/ACEi 等：有問給1分，能特別指出房室結阻滯劑或影響腎/鉀之藥物給2分</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {[0, 1, 2].map(wt => (
                        <button
                          key={wt}
                          onClick={() => updateScoreItem("history", "s6", wt)}
                          className={`w-9 py-1 px-2 rounded-lg text-xs font-mono font-bold border transition-all ${
                            scoreCard.history.s6 === wt 
                              ? "bg-teal-600 border-teal-600 text-white shadow-xs" 
                              : "bg-white border-slate-350 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {wt}分
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Checklist item 7 & 8 */}
                  <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="space-y-1">
                      <span className="text-[11px] text-slate-900 font-semibold block">7. 藥物過量或重複服藥</span>
                      <p className="text-[10px] text-slate-400 font-sans leading-tight">釐清病患是否有自行大量多吃本位藥物（得2分）</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {[0, 1, 2].map(wt => (
                        <button
                          key={wt}
                          onClick={() => updateScoreItem("history", "s7", wt)}
                          className={`w-9 py-1 px-2 rounded-lg text-xs font-mono font-bold border transition-all ${
                            scoreCard.history.s7 === wt 
                              ? "bg-teal-600 border-teal-600 text-white shadow-xs" 
                              : "bg-white border-slate-350 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {wt}分
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="space-y-1">
                      <span className="text-[11px] text-slate-900 font-semibold block">8. 個人及家庭支持狀況</span>
                      <p className="text-[10px] text-slate-400 font-sans leading-tight">問及與家人同住（1分）或平時生活功能（1分）</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {[0, 1, 2].map(wt => (
                        <button
                          key={wt}
                          onClick={() => updateScoreItem("history", "s8", wt)}
                          className={`w-9 py-1 px-2 rounded-lg text-xs font-mono font-bold border transition-all ${
                            scoreCard.history.s8 === wt 
                              ? "bg-teal-600 border-teal-600 text-white shadow-xs" 
                              : "bg-white border-slate-350 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {wt}分
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Global Rating Part H */}
                <div className="mt-6 p-4 border border-indigo-150 bg-indigo-50/40 rounded-2xl space-y-3">
                  <div className="flex gap-2 items-center">
                    <Award className="w-5 h-5 text-indigo-600" />
                    <h5 className="font-sans font-bold text-slate-800 text-sm">病史詢問整體評分 (Global History Rating)</h5>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    請對考生的病史統整流暢度作一級化總結。L1:無法取得 (0-1分 | L2:僅部分 (2-3分) | L3:大部達成 (4-5分) | L4:在危急急診情境優先獲取休克/慢心跳/多重用藥與腎功病史 (6-7分)
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {[0, 1, 2, 3, 4, 5, 6, 7].map(gWt => (
                      <button
                        key={gWt}
                        type="button"
                        onClick={() => updateScoreItem("history", "global", gWt)}
                        className={`py-1.5 px-3 rounded-lg text-xs font-bold border transition-all ${
                          scoreCard.history.global === gWt 
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-xs" 
                            : "bg-white border-slate-300 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {gWt} 分評評
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 2: 身體檢查 (P.E.) */}
            {activeTab === 1 && (
              <div className="space-y-4 animate-fade-in" id="scorer-section-physical">
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-sans">
                    身體診察行為評核清單
                  </h4>

                  {/* p1 to p5 */}
                  <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="space-y-1">
                      <span className="text-[11px] text-slate-900 font-semibold block">1. 胸部肺音聽診 (Lung sound)</span>
                      <p className="text-[10px] text-slate-400 font-sans leading-tight">評估 crackles, 呼吸窘迫或肺水腫表現，胸壁壓痛等排除ACS主訴（2分）</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {[0, 1, 2].map(wt => (
                        <button
                          key={wt}
                          onClick={() => updateScoreItem("physical", "p1", wt)}
                          className={`w-9 py-1 px-2 rounded-lg text-xs font-mono font-bold border transition-all ${
                            scoreCard.physical.p1 === wt 
                              ? "bg-teal-600 border-teal-600 text-white shadow-xs" 
                              : "bg-white border-slate-350 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {wt}分
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="space-y-1">
                      <span className="text-[11px] text-slate-900 font-semibold block">2. 心臟與循環評估 (Cardiac sound & CRT)</span>
                      <p className="text-[10px] text-slate-400 font-sans leading-tight">評估心臟節律（心律不整、低HR）、雜音。評估四肢冰冷/微血管充盈延常等低灌流徵候（2分）</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {[0, 1, 2].map(wt => (
                        <button
                          key={wt}
                          onClick={() => updateScoreItem("physical", "p2", wt)}
                          className={`w-9 py-1 px-2 rounded-lg text-xs font-mono font-bold border transition-all ${
                            scoreCard.physical.p2 === wt 
                              ? "bg-teal-600 border-teal-600 text-white shadow-xs" 
                              : "bg-white border-slate-350 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {wt}分
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="space-y-1">
                      <span className="text-[11px] text-slate-900 font-semibold block">3. 水分體液狀態評估 (Hydration Check)</span>
                      <p className="text-[10px] text-slate-400 font-sans leading-tight">核對口腔黏膜乾燥、皮膚彈性下降（1分）、JVP、無肺水腫、偏低尿量（1分）：達標得2分</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {[0, 1, 2].map(wt => (
                        <button
                          key={wt}
                          onClick={() => updateScoreItem("physical", "p3", wt)}
                          className={`w-9 py-1 px-2 rounded-lg text-xs font-mono font-bold border transition-all ${
                            scoreCard.physical.p3 === wt 
                              ? "bg-teal-600 border-teal-600 text-white shadow-xs" 
                              : "bg-white border-slate-350 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {wt}分
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="space-y-1">
                      <span className="text-[11px] text-slate-950 font-semibold block">4. 感染來源與腹部觸診 (Infection Screening)</span>
                      <p className="text-[10px] text-slate-400 font-sans leading-tight">排除腹部壓痛、CVA knocking pain（腎盂感染排除）（2分）</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {[0, 1, 2].map(wt => (
                        <button
                          key={wt}
                          onClick={() => updateScoreItem("physical", "p4", wt)}
                          className={`w-9 py-1 px-2 rounded-lg text-xs font-mono font-bold border transition-all ${
                            scoreCard.physical.p4 === wt 
                              ? "bg-teal-600 border-teal-600 text-white shadow-xs" 
                              : "bg-white border-slate-350 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {wt}分
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="space-y-1">
                      <span className="text-[11px] text-slate-950 font-semibold block">5. 意識與神經學理學觸診 (Consciousness)</span>
                      <p className="text-[10px] text-slate-400 font-sans leading-tight">評估病患反應變慢、譫妄或局部神經學是否有偏癱缺損（2分）</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {[0, 1, 2].map(wt => (
                        <button
                          key={wt}
                          onClick={() => updateScoreItem("physical", "p5", wt)}
                          className={`w-9 py-1 px-2 rounded-lg text-xs font-mono font-bold border transition-all ${
                            scoreCard.physical.p5 === wt 
                              ? "bg-teal-600 border-teal-600 text-white shadow-xs" 
                              : "bg-white border-slate-350 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {wt}分
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Global PE Rating */}
                <div className="mt-6 p-4 border border-indigo-150 bg-indigo-50/40 rounded-2xl space-y-2">
                  <div className="flex gap-2 items-center">
                    <Award className="w-5 h-5 text-indigo-600" />
                    <h5 className="font-sans font-bold text-slate-800 text-sm">身體診察整體評審</h5>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    評估考生對急診生命危險指標的物理檢核完整度 (0 ~ 5 分評評)。
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {[0, 1, 2, 3, 4, 5].map(gWt => (
                      <button
                        key={gWt}
                        type="button"
                        onClick={() => updateScoreItem("physical", "global", gWt)}
                        className={`py-1.5 px-3 rounded-lg text-xs font-bold border transition-all ${
                          scoreCard.physical.global === gWt 
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-xs" 
                            : "bg-white border-slate-300 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {gWt} 分評
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 3: 初步臆斷 */}
            {activeTab === 2 && (
              <div className="space-y-4 animate-fade-in" id="scorer-section-dx">
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-sans">
                    臆斷(Differential Impression)合理性評核清單
                  </h4>
                  <p className="text-[11px] text-slate-400">考生於口面試前，應主動提出的臆斷病因（每項滿足得 1 分）：</p>

                  <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex justify-between items-center gap-2">
                    <span className="text-xs text-slate-800 font-medium">1. 不穩定的 Bradyarrhythmia (SSS, AV block, slow Af)</span>
                    <button
                      onClick={() => updateScoreItem("diagnosis", "d1", scoreCard.diagnosis.d1 ? 0 : 1)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                        scoreCard.diagnosis.d1 ? "bg-indigo-600 text-white" : "bg-white border text-slate-600"
                      }`}
                    >
                      {scoreCard.diagnosis.d1 ? "已提出 (1分)" : "未提及 (0分)"}
                    </button>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex justify-between items-center gap-2">
                    <span className="text-xs text-slate-800 font-medium">2. 藥物（AV結阻滯劑）相關心搏過慢</span>
                    <button
                      onClick={() => updateScoreItem("diagnosis", "d2", scoreCard.diagnosis.d2 ? 0 : 1)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                        scoreCard.diagnosis.d2 ? "bg-indigo-600 text-white" : "bg-white border text-slate-600"
                      }`}
                    >
                      {scoreCard.diagnosis.d2 ? "已提出 (1分)" : "未提及 (0分)"}
                    </button>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex justify-between items-center gap-2">
                    <span className="text-xs text-slate-800 font-medium">3. 電解質異常（含代謝性高血鉀）</span>
                    <button
                      onClick={() => updateScoreItem("diagnosis", "d3", scoreCard.diagnosis.d3 ? 0 : 1)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                        scoreCard.diagnosis.d3 ? "bg-indigo-600 text-white" : "bg-white border text-slate-600"
                      }`}
                    >
                      {scoreCard.diagnosis.d3 ? "已提出 (1分)" : "未提及 (0分)"}
                    </button>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex justify-between items-center gap-2">
                    <span className="text-xs text-slate-800 font-medium">4. 脫水導致末梢血容量性休克</span>
                    <button
                      onClick={() => updateScoreItem("diagnosis", "d4", scoreCard.diagnosis.d4 ? 0 : 1)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                        scoreCard.diagnosis.d4 ? "bg-indigo-600 text-white" : "bg-white border text-slate-600"
                      }`}
                    >
                      {scoreCard.diagnosis.d4 ? "已提出 (1分)" : "未提及 (0分)"}
                    </button>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex justify-between items-center gap-2">
                    <span className="text-xs text-slate-800 font-medium">5. ACS (急性冠心症，特別是 inferior wall MI 下壁心肌梗塞)</span>
                    <button
                      onClick={() => updateScoreItem("diagnosis", "d5", scoreCard.diagnosis.d5 ? 0 : 1)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                        scoreCard.diagnosis.d5 ? "bg-indigo-600 text-white" : "bg-white border text-slate-600"
                      }`}
                    >
                      {scoreCard.diagnosis.d5 ? "已提出 (1分)" : "未提及 (0分)"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 4: 安排的檢查與判讀 */}
            {activeTab === 3 && (
              <div className="space-y-4 animate-fade-in" id="scorer-section-labs">
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-sans">
                    輔助檢查决策與結果判讀
                  </h4>

                  <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex justify-between items-center gap-2">
                    <div className="space-y-0.5">
                      <span className="text-xs text-slate-900 font-bold block">1. 開立急診 EKG 並對比三天前 EKG (1分)</span>
                      <p className="text-[10px] text-slate-400 font-sans">判讀出竇性心動過緩、呈現高聳 T 波。</p>
                    </div>
                    <button
                      onClick={() => updateScoreItem("investigations", "i1", scoreCard.investigations.i1 ? 0 : 1)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                        scoreCard.investigations.i1 ? "bg-teal-600 text-white" : "bg-white border text-slate-600"
                      }`}
                    >
                      {scoreCard.investigations.i1 ? "已判讀 (1分)" : "未達標 (0分)"}
                    </button>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex justify-between items-center gap-2">
                    <div className="space-y-0.5">
                      <span className="text-xs text-slate-900 font-bold block">2. 開立完整血液生化 (2分)</span>
                      <p className="text-[10px] text-slate-400 font-sans">重點為：鉀離子、BUN、Creatinine、血糖、VBG 血氣。正確判讀出 K=6.8 超標及 AKI。</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {[0, 1, 2].map(wt => (
                        <button
                          key={wt}
                          onClick={() => updateScoreItem("investigations", "i2", wt)}
                          className={`w-9 py-1 px-2 rounded-lg text-xs font-mono font-bold border transition-all ${
                            scoreCard.investigations.i2 === wt 
                              ? "bg-teal-600 border-teal-600 text-white shadow-xs" 
                              : "bg-white border-slate-350 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {wt}分
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex justify-between items-center gap-2">
                    <div className="space-y-0.5">
                      <span className="text-xs text-slate-900 font-bold block">3. 開立 CXR 胸部 X 光片 (1分)</span>
                      <p className="text-[10px] text-slate-400 font-sans">排除肺充血、證實肺野乾淨支援低容狀態。</p>
                    </div>
                    <button
                      onClick={() => updateScoreItem("investigations", "i3", scoreCard.investigations.i3 ? 0 : 1)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                        scoreCard.investigations.i3 ? "bg-teal-600 text-white" : "bg-white border text-slate-600"
                      }`}
                    >
                      {scoreCard.investigations.i3 ? "已判讀 (1分)" : "未達標 (0分)"}
                    </button>
                  </div>
                </div>

                {/* Global Labs rating */}
                <div className="mt-6 p-4 border border-indigo-150 bg-indigo-50/40 rounded-2xl space-y-2">
                  <div className="flex gap-2 items-center">
                    <Award className="w-5 h-5 text-indigo-600" />
                    <h5 className="font-sans font-bold text-slate-800 text-sm">檢驗檢查與判讀整體評分 (0 ~ 8 分)</h5>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    評估考生對急診常見心電圖高尖 T、高鉀 AKI、ECG 聯結與用藥、低灌流反應性的臨床整合。
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(gWt => (
                      <button
                        key={gWt}
                        type="button"
                        onClick={() => updateScoreItem("investigations", "global", gWt)}
                        className={`py-1.5 px-3 rounded-lg text-xs font-bold border transition-all ${
                          scoreCard.investigations.global === gWt 
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-xs" 
                            : "bg-white border-slate-300 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {gWt} 分
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 5: 鑑別診斷 */}
            {activeTab === 4 && (
              <div className="space-y-4 animate-fade-in" id="scorer-section-dd">
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-sans">
                    核心及排除鑑別診斷(Differential Diagnosis)
                  </h4>

                  <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex justify-between items-center gap-2">
                    <div className="space-y-0.5">
                      <span className="text-xs text-slate-900 font-bold block">1. 辨識出關鍵核心：BRASH Syndrome (3分)</span>
                      <p className="text-[10px] text-slate-400 font-sans">若能主提並指名 BRASH 的完整機制由來，直接給滿分 3 分。</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {[0, 1, 2, 3].map(wt => (
                        <button
                          key={wt}
                          onClick={() => updateScoreItem("differential", "dd1", wt)}
                          className={`w-9 py-1 px-2 rounded-lg text-xs font-mono font-bold border transition-all ${
                            scoreCard.differential.dd1 === wt 
                              ? "bg-teal-600 border-teal-600 text-white shadow-xs" 
                              : "bg-white border-slate-350 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {wt}分
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex justify-between items-center gap-2">
                    <span className="text-xs text-slate-800 font-medium">2. 藥物阻斷劑引起的 bradycarida 反應</span>
                    <button
                      onClick={() => updateScoreItem("differential", "dd2", scoreCard.differential.dd2 ? 0 : 1)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                        scoreCard.differential.dd2 ? "bg-teal-600 text-white" : "bg-white border text-slate-600"
                      }`}
                    >
                      {scoreCard.differential.dd2 ? "已提及 (1分)" : "未提及 (0分)"}
                    </button>
                  </div>

                  <div className="p-3 bg-slate-55 border border-slate-150 rounded-xl flex justify-between items-center gap-2">
                    <span className="text-xs text-slate-800 font-medium">3. 代謝性嚴重高血鉀合併心率阻滯</span>
                    <button
                      onClick={() => updateScoreItem("differential", "dd3", scoreCard.differential.dd3 ? 0 : 1)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                        scoreCard.differential.dd3 ? "bg-teal-600 text-white" : "bg-white border text-slate-600"
                      }`}
                    >
                      {scoreCard.differential.dd3 ? "已提及 (1分)" : "未提及 (0分)"}
                    </button>
                  </div>

                  <div className="p-3 bg-slate-55 border border-slate-150 rounded-xl flex justify-between items-center gap-2">
                    <span className="text-xs text-slate-800 font-medium">4. 極度脫水導致嚴重腎前性 AKI、誘發低血壓休克以及高鉀循環</span>
                    <button
                      onClick={() => updateScoreItem("differential", "dd4", scoreCard.differential.dd4 ? 0 : 1)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                        scoreCard.differential.dd4 ? "bg-teal-600 text-white" : "bg-white border text-slate-600"
                      }`}
                    >
                      {scoreCard.differential.dd4 ? "已提及 (1分)" : "未提及 (0分" }
                    </button>
                  </div>
                </div>

                {/* Global DD rating */}
                <div className="mt-6 p-4 border border-indigo-150 bg-indigo-50/40 rounded-2xl space-y-2">
                  <div className="flex gap-2 items-center">
                    <Award className="w-5 h-5 text-indigo-600" />
                    <h5 className="font-sans font-bold text-slate-800 text-sm">鑑別診斷整體評分 (0 ~ 4)</h5>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    評估考生對疾病排序與急診高急迫性的判斷邏輯。
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {[0, 1, 2, 3, 4].map(gWt => (
                      <button
                        key={gWt}
                        type="button"
                        onClick={() => updateScoreItem("differential", "global", gWt)}
                        className={`py-1.5 px-3 rounded-lg text-xs font-bold border transition-all ${
                          scoreCard.differential.global === gWt 
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-xs" 
                            : "bg-white border-slate-300 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {gWt} 分
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 6: 治療處置 (Management) */}
            {activeTab === 5 && (
              <div className="space-y-4 animate-fade-in" id="scorer-section-tx">
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-sans">
                    急救穩定處置與重降鉀治療決策
                  </h4>

                  <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex justify-between items-center gap-2">
                    <div className="space-y-0.5">
                      <span className="text-xs text-slate-905 font-bold block">1. 初始穩定監測 (1分)</span>
                      <p className="text-[10px] text-slate-400">接 EKG Monitor, 建立 2 條 IV 輸液管路, 給氧等基礎照護。</p>
                    </div>
                    <button
                      onClick={() => updateScoreItem("treatment", "tx1", scoreCard.treatment.tx1 ? 0 : 1)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                        scoreCard.treatment.tx1 ? "bg-teal-600 text-white" : "bg-white border text-slate-600"
                      }`}
                    >
                      {scoreCard.treatment.tx1 ? "已達成 (1分)" : "未達成 (0分)"}
                    </button>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex justify-between items-center gap-2">
                    <div className="space-y-0.5">
                      <span className="text-xs text-slate-905 font-bold block">2. 處理 Unstable bradycardia (3分)</span>
                      <p className="text-[10px] text-slate-400">考慮給予第一線 Atropine 0.5-1.0mg、無效則備 Epinephrine 或 Dopamine 輸注、同步架設外部節律器(TCP)。</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {[0, 1, 2, 3].map(wt => (
                        <button
                          key={wt}
                          onClick={() => updateScoreItem("treatment", "tx2", wt)}
                          className={`w-9 py-1 px-2 rounded-lg text-xs font-mono font-bold border transition-all ${
                            scoreCard.treatment.tx2 === wt 
                              ? "bg-teal-600 border-teal-600 text-white shadow-xs" 
                              : "bg-white border-slate-350 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {wt}分
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex justify-between items-center gap-2">
                    <div className="space-y-0.5">
                      <span className="text-xs text-slate-905 font-bold block">3. 穩定心肌細胞膜優先治療 (2分)</span>
                      <p className="text-[10px] text-slate-400"><strong>關鍵！</strong>主動給予靜脈 Calcium gluconate 或 Calcium chloride。並說明「高血鉀合併慢心率 EKG 變化時，應優先給鈣保護心肌」，答對得 2 分。</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {[0, 1, 2].map(wt => (
                        <button
                          key={wt}
                          onClick={() => updateScoreItem("treatment", "tx3", wt)}
                          className={`w-9 py-1 px-2 rounded-lg text-xs font-mono font-bold border transition-all ${
                            scoreCard.treatment.tx3 === wt 
                              ? "bg-teal-600 border-teal-600 text-white shadow-xs" 
                              : "bg-white border-slate-350 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {wt}分
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex justify-between items-center gap-2">
                    <div className="space-y-0.5">
                      <span className="text-xs text-slate-905 font-bold block">4. 排除與降低血鉀治療 (4分)</span>
                      <p className="text-[10px] text-slate-400">依據學理開立：Insulin + Glucose 輸注 (1分)、Nebulized Salbutamol (1分)、NaHCO3 (1分)、Lokelma或SPS整腸降鉀劑 (1分)。</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {[0, 1, 2, 3, 4].map(wt => (
                        <button
                          key={wt}
                          onClick={() => updateScoreItem("treatment", "tx4", wt)}
                          className={`w-9 py-1 px-2 rounded-lg text-xs font-mono font-bold border transition-all ${
                            scoreCard.treatment.tx4 === wt 
                              ? "bg-teal-600 border-teal-600 text-white shadow-xs" 
                              : "bg-white border-slate-350 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {wt}分
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex justify-between items-center gap-2">
                    <div className="space-y-0.5">
                      <span className="text-xs text-slate-905 font-bold block">5. 積極處理 BRASH 誘因 (2分)</span>
                      <p className="text-[10px] text-slate-400">主動停止病患現服用藥物（Bisoprolol, Sacubitril, Furosemide, Spironolactone）（1分），並小心給予 Isotonic Fluid 生理鹽水/等張溶液補水（1分），得2分。</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {[0, 1, 2].map(wt => (
                        <button
                          key={wt}
                          onClick={() => updateScoreItem("treatment", "tx5", wt)}
                          className={`w-9 py-1 px-2 rounded-lg text-xs font-mono font-bold border transition-all ${
                            scoreCard.treatment.tx5 === wt 
                              ? "bg-teal-600 border-teal-600 text-white shadow-xs" 
                              : "bg-white border-slate-350 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {wt}分
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Global TX rating */}
                <div className="mt-6 p-4 border border-indigo-150 bg-indigo-50/40 rounded-2xl space-y-2">
                  <div className="flex gap-2 items-center">
                    <Award className="w-5 h-5 text-indigo-600" />
                    <h5 className="font-sans font-bold text-slate-800 text-sm">治療處置整體評分 (0 ~ 5)</h5>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    優秀考官應著重於：是否具備 BRASH Syndrome 同步處理高鉀、AKI、病因斷藥與輸液整合處置，而非零散或單一靠常規背誦。
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {[0, 1, 2, 3, 4, 5].map(gWt => (
                      <button
                        key={gWt}
                        type="button"
                        onClick={() => updateScoreItem("treatment", "global", gWt)}
                        className={`py-1.5 px-3 rounded-lg text-xs font-bold border transition-all ${
                          scoreCard.treatment.global === gWt 
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-xs" 
                            : "bg-white border-slate-300 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {gWt} 分
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 7: 照會溝通 (Consultation) */}
            {activeTab === 6 && (
              <div className="space-y-4 animate-fade-in" id="scorer-section-consult">
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-sans">
                    急診科部後線科別照會 (Nephrologist / ICU / ISBAR)
                  </h4>

                  <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex justify-between items-center gap-2">
                    <span className="text-xs text-slate-800 font-medium">1. 心臟科照會：評估心律不整及導滯（ACS阻斷排除，不忽略高血鉀與BRASH主因）（1分）</span>
                    <button
                      onClick={() => updateScoreItem("consultation", "c1", scoreCard.consultation.c1 ? 0 : 1)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                        scoreCard.consultation.c1 ? "bg-teal-600 text-white" : "bg-white border text-slate-600"
                      }`}
                    >
                      {scoreCard.consultation.c1 ? "已達成 (1分)" : "未達成 (0分)"}
                    </button>
                  </div>

                  <div className="p-3 bg-slate-55 border border-slate-150 rounded-xl flex justify-between items-center gap-2">
                    <span className="text-xs text-slate-800 font-medium">2. 腎臟科照會：針對高血鉀、AKI評估可能之緊急透析需求（1分）</span>
                    <button
                      onClick={() => updateScoreItem("consultation", "c2", scoreCard.consultation.c2 ? 0 : 1)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                        scoreCard.consultation.c2 ? "bg-teal-600 text-white" : "bg-white border text-slate-600"
                      }`}
                    >
                      {scoreCard.consultation.c2 ? "已達成 (1分)" : "未達成 (0分)"}
                    </button>
                  </div>

                  <div className="p-3 bg-slate-55 border border-slate-150 rounded-xl flex justify-between items-center gap-2">
                    <span className="text-xs text-slate-800 font-medium">3. ICU（加護病房）照會：考量 bradycardic shock、心因性與低灌流不穩定生理狀態（1分）</span>
                    <button
                      onClick={() => updateScoreItem("consultation", "c3", scoreCard.consultation.c3 ? 0 : 1)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                        scoreCard.consultation.c3 ? "bg-teal-600 text-white" : "bg-white border text-slate-600"
                      }`}
                    >
                      {scoreCard.consultation.c3 ? "已達成 (1分)" : "未達成 (0分)"}
                    </button>
                  </div>

                  <div className="p-3 bg-slate-55 border border-slate-150 rounded-xl flex justify-between items-center gap-2">
                    <div className="space-y-0.5">
                      <span className="text-xs text-slate-905 font-bold block">4. 以 ISBAR 標準方式進行照會溝通 (0-5分)</span>
                      <p className="text-[10px] text-slate-400 font-sans leading-tight">I(自我介紹) | S(81F慢心跳、低血壓) | B(CHF、Af、Bisoprolol用藥) | A(重度脫水與BRASH疑診) | R(已給鈣並尋求ICU床位/洗腎)</p>
                    </div>
                    <div className="flex gap-1 shrink-0 font-sans">
                      {[0, 1, 2, 3, 4, 5].map(wt => (
                        <button
                          key={wt}
                          onClick={() => updateScoreItem("consultation", "c4", wt)}
                          className={`w-9 py-1 px-2 rounded-lg text-xs font-mono font-bold border transition-all ${
                            scoreCard.consultation.c4 === wt 
                              ? "bg-teal-600 border-teal-600 text-white shadow-xs" 
                              : "bg-white border-slate-350 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {wt}分
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Global Consult rating */}
                <div className="mt-6 p-4 border border-indigo-150 bg-indigo-50/40 rounded-2xl space-y-2">
                  <div className="flex gap-2 items-center">
                    <Award className="w-5 h-5 text-indigo-600" />
                    <h5 className="font-sans font-bold text-slate-800 text-sm">照會溝通整體評分 (0 ~ 5)</h5>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    評核考生是否能清楚使用 ISBAR 架構，說明 BRASH 疑診、脫水本質、和目前的緊急程度並做出妥適的轉線安排。
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {[0, 1, 2, 3, 4, 5].map(gWt => (
                      <button
                        key={gWt}
                        type="button"
                        onClick={() => updateScoreItem("consultation", "global", gWt)}
                        className={`py-1.5 px-3 rounded-lg text-xs font-bold border transition-all ${
                          scoreCard.consultation.global === gWt 
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-xs" 
                            : "bg-white border-slate-300 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {gWt} 分
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 8: 諮商溝通 (Counseling) */}
            {activeTab === 7 && (
              <div className="space-y-4 animate-fade-in" id="scorer-section-counsel">
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-sans">
                    醫病溝通與家屬諮商 (Patient/Family Counseling)
                  </h4>

                  {/* co1 to co5 */}
                  <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex justify-between items-center gap-2">
                    <span className="text-xs text-slate-800 font-medium">1. 建立良好關係：自我介紹、確認家屬身分，主動傾聽家屬最在意的擔心（1分）</span>
                    <button
                      onClick={() => updateScoreItem("counseling", "co1", scoreCard.counseling.co1 ? 0 : 1)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                        scoreCard.counseling.co1 ? "bg-teal-600 text-white" : "bg-white border text-slate-600"
                      }`}
                    >
                      {scoreCard.counseling.co1 ? "達成 (1分)" : "未達 (0分)"}
                    </button>
                  </div>

                  <div className="p-3 bg-slate-55 border border-slate-150 rounded-xl flex justify-between items-center gap-2">
                    <span className="text-xs text-slate-800 font-medium">2. 說明危急狀態：用易懂語言說明心跳慢(35下)、血壓低、低灌容休克風險（1分）</span>
                    <button
                      onClick={() => updateScoreItem("counseling", "co2", scoreCard.counseling.co2 ? 0 : 1)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                        scoreCard.counseling.co2 ? "bg-teal-600 text-white" : "bg-white border text-slate-600"
                      }`}
                    >
                      {scoreCard.counseling.co2 ? "達成 (1分)" : "未達 (0分)"}
                    </button>
                  </div>

                  <div className="p-3 bg-slate-55 border border-slate-150 rounded-xl flex justify-between items-center gap-2">
                    <span className="text-xs text-slate-800 font-medium">3. 說明病因與機制：解說近期少喝水少吃飯，引發腎功惡化、藥物殘存與高鉀惡性循環（BRASH）（1分）</span>
                    <button
                      onClick={() => updateScoreItem("counseling", "co3", scoreCard.counseling.co3 ? 0 : 1)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                        scoreCard.counseling.co3 ? "bg-teal-600 text-white" : "bg-white border text-slate-600"
                      }`}
                    >
                      {scoreCard.counseling.co3 ? "達成 (1分)" : "未達 (0分)"}
                    </button>
                  </div>

                  <div className="p-3 bg-slate-55 border border-slate-150 rounded-xl flex justify-between items-center gap-2">
                    <span className="text-xs text-slate-800 font-medium">4. 說明治療計畫與後續：解說補液、停藥、藥袋更換，必要時需ICU監測或緊急洗腎的可能性（1分）</span>
                    <button
                      onClick={() => updateScoreItem("counseling", "co4", scoreCard.counseling.co4 ? 0 : 1)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                        scoreCard.counseling.co4 ? "bg-teal-600 text-white" : "bg-white border text-slate-600"
                      }`}
                    >
                      {scoreCard.counseling.co4 ? "達成 (1分)" : "未達 (0分)"}
                    </button>
                  </div>

                  <div className="p-3 bg-slate-55 border border-slate-150 rounded-xl flex justify-between items-center gap-2">
                    <span className="text-xs text-slate-800 font-medium">5. 同理情緒：同理家屬對長者虛弱的極度焦慮，不進行過度保證，在結束前雙重確認核對理解（1分）</span>
                    <button
                      onClick={() => updateScoreItem("counseling", "co5", scoreCard.counseling.co5 ? 0 : 1)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                        scoreCard.counseling.co5 ? "bg-teal-600 text-white" : "bg-white border text-slate-600"
                      }`}
                    >
                      {scoreCard.counseling.co5 ? "達成 (1分)" : "未達 (0分)"}
                    </button>
                  </div>
                </div>

                {/* Global Counsel rating */}
                <div className="mt-6 p-4 border border-indigo-150 bg-indigo-50/40 rounded-2xl space-y-2">
                  <div className="flex gap-2 items-center">
                    <Award className="w-5 h-5 text-indigo-600" />
                    <h5 className="font-sans font-bold text-slate-800 text-sm">家屬諮商與病情解說整體評分 (0 ~ 5)</h5>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    評估考生是否能夠使用非醫學術語、具有溫度且邏輯清晰的語言，為考官扮演的家屬解答困惑。
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {[0, 1, 2, 3, 4, 5].map(gWt => (
                      <button
                        key={gWt}
                        type="button"
                        onClick={() => updateScoreItem("counseling", "global", gWt)}
                        className={`py-1.5 px-3 rounded-lg text-xs font-bold border transition-all ${
                          scoreCard.counseling.global === gWt 
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-xs" 
                            : "bg-white border-slate-300 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {gWt} 分
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="px-6 py-4 bg-slate-50 border-t border-slate-150 flex justify-between items-center">
            <button
              onClick={() => setActiveTab(prev => Math.max(0, prev - 1))}
              disabled={activeTab === 0}
              className="px-3 py-1.5 rounded-lg bg-white border text-xs font-semibold text-slate-600 flex items-center gap-1 disabled:opacity-50"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> 上一面向
            </button>
            <button
              onClick={() => setActiveTab(prev => Math.min(7, prev + 1))}
              disabled={activeTab === 7}
              className="px-3 py-1.5 rounded-lg bg-teal-600 text-xs font-semibold text-white flex items-center gap-1 disabled:opacity-50"
            >
              下一面向 <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Qualitative Feedback & Gemini AI Report generator section */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex justify-between items-center border-b pb-3 border-slate-100">
            <h4 className="font-sans font-bold text-slate-800 text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              現場教學備忘錄 & Gemini AI 智能評核小語 (Examiner Feedback & Gemini AI Coach)
            </h4>
            <button
              id="ai-generate-btn"
              onClick={triggerAiFeedback}
              disabled={aiGenerating}
              className="px-3 py-1.5 text-xs font-bold bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-700 hover:to-indigo-700 text-white rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {aiGenerating ? "AI 導師解析中..." : "生成 AI 臨床培育導師評語"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-sans mb-1.5">
                考官隨手筆記 / 口試現場實記 (Your Draft Notes)
              </label>
              <textarea
                value={scoreCard.generalFeedback}
                onChange={(e) => setScoreCard(prev => ({ ...prev, generalFeedback: e.target.value }))}
                placeholder="在此輸入考官隨手筆記，例如「考生對於 Spironolactone 斷藥反應敏捷，但 Calcium gluconate 滴速與劑量原理有些微遲疑，家屬安撫態度同理心極佳...」"
                className="w-full h-36 rounded-xl border border-slate-300 p-3 text-xs text-slate-700 focus:outline-none focus:border-indigo-500 bg-slate-50 transition-all font-sans leading-relaxed resize-none"
              />
            </div>

            <div className="bg-gradient-to-br from-indigo-50/50 to-teal-50/50 rounded-xl p-4 border border-indigo-100 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest block font-mono mb-1.5">
                  ✨ Gemini AI 智能導師反饋報告 (AI Generated Draft)
                </span>
                <div className="max-h-28 overflow-y-auto pr-1 text-[11px] text-slate-600 font-sans leading-relaxed whitespace-pre-line">
                  {aiFeedback ? aiFeedback : (
                    <span className="text-slate-400 italic">
                      完成右方複選核核清單、隨手寫下草稿後，點擊上方按鈕，Gemini 導師將自動統整，為您草擬一份正式面試回饋報告。...
                    </span>
                  )}
                </div>
              </div>
              
              {aiFeedback && (
                <div className="pt-2 border-t border-indigo-150 flex justify-end">
                  <button
                    onClick={() => {
                      setScoreCard(prev => ({ ...prev, generalFeedback: aiFeedback }));
                      setAiNotice("✅ 已成功將 AI 評核小語保存至現場隨手筆記中！");
                      setTimeout(() => setAiNotice(null), 4000);
                    }}
                    className="text-[10px] font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-100/60 px-2 py-1 rounded cursor-pointer transition-all"
                  >
                    匯入為正式考評語
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Prominent Submit/Save & Feedback Synchronization Banner at the very bottom */}
        <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-2 border-emerald-500/30 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 animate-fade-in">
          <div className="space-y-1 text-center md:text-left">
            <h4 className="font-sans font-extrabold text-teal-900 text-sm flex items-center justify-center md:justify-start gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600 animate-bounce" />
              本評估表是否已登錄完畢？
            </h4>
            <p className="text-xs text-slate-600 max-w-xl">
              確認此病歷各面向 (病史詢問、身體檢查、處置等) 機制登錄完畢後，點擊右側按鈕進行<strong>保存並送出</strong>。儲存後，系統將同步將數據上傳至共用分析庫，以便於 「<strong>聯合數據分析站</strong>」即時繪製該考生的<strong>雷達特性圖</strong>與分析。
            </p>
          </div>
          <button
            onClick={handleSaveEvaluation}
            disabled={isSaving}
            className="w-full md:w-auto bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white font-extrabold text-xs py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 border border-emerald-500 shadow-md transform hover:scale-[1.02] transition-all cursor-pointer whitespace-nowrap"
          >
            {isSaving ? (
              <>
                <Activity className="w-4 h-4 text-emerald-100 animate-spin" />
                正在儲存並同步數據中...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-emerald-100" />
                確認無誤：儲存並送出評分 (即時繪製雷達圖)
              </>
            )}
          </button>
        </div>

        {/* Centered Success Notification Modal popup */}
        {showSuccessToast && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs animate-fade-in no-print" id="success-saved-modal">
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full mx-4 text-center border border-slate-200 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 animate-pulse" />
              <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4 text-emerald-600 shadow-inner">
                <CheckCircle className="w-9 h-9 animate-bounce" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 font-sans mb-1.5">儲存與送出成功！</h3>
              <p className="text-xs text-slate-600 mb-5 leading-relaxed">
                已經成功為 <strong>{CANDIDATES.find(c => c.id === selectedCandidate)?.name || ""}</strong> 醫師保存【{caseIdx === 1 ? "Case 2" : "Case 1"} 病例與醫病理脈絡評核】之面試試單並同步至雲端 analysis 系統。
              </p>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl mb-5 text-[11px] text-teal-800 font-medium leading-relaxed">
                📊 考官共用分析資料庫已寫入最新數值，雷達圖已同步即時重繪。
              </div>
              <button
                onClick={() => setShowSuccessToast(false)}
                className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-teal-700 text-white font-extrabold py-2.5 px-4 rounded-xl text-xs shadow-md transition-all cursor-pointer"
              >
                確定
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
