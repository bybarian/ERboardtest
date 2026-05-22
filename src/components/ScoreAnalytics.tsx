import { useState, useEffect } from "react";
import { CANDIDATES, INSTRUCTORS } from "../data/workshopData";
import { ScoreCard } from "../types";
import { 
  Printer, Award, BarChart4, Clipboard, User, Calendar, RefreshCw, Trash2, ShieldCheck, HelpCircle, Download
} from "lucide-react";

interface ScoreAnalyticsProps {
  triggerCount: number;
  onSelectCandidate: (id: string) => void;
}

// Default initial simulation data to populate analytics automatically for a fully immersive startup experience
const MOCK_HISTORIC_REPORTS: ScoreCard[] = [
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

export default function ScoreAnalytics({ triggerCount, onSelectCandidate }: ScoreAnalyticsProps) {
  const [evaluations, setEvaluations] = useState<ScoreCard[]>([]);
  const [selectedEvalKey, setSelectedEvalKey] = useState<string>("");
  const [showConfirmClear, setShowConfirmClear] = useState<boolean>(false);
  const [clearStatus, setClearStatus] = useState<string | null>(null);

  useEffect(() => {
    loadEvaluations();
  }, [triggerCount]);

  const loadEvaluations = () => {
    // Try syncing with shared full-stack server first
    fetch("/api/scores")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.scores && data.scores.length > 0) {
          setEvaluations(data.scores);
          
          const exists = data.scores.some((e: any) => `${e.candidateId}_${e.evaluatorId}` === selectedEvalKey);
          if (!exists || !selectedEvalKey) {
            setSelectedEvalKey(`${data.scores[0].candidateId}_${data.scores[0].evaluatorId}`);
          }
        } else {
          loadFromLocal();
        }
      })
      .catch((err) => {
        console.error("Shared server fetch failed, loading offline-first from localStorage: ", err);
        loadFromLocal();
      });
  };

  const loadFromLocal = () => {
    // Collect saved evaluations from localStorage
    const savedKeys: string[] = JSON.parse(localStorage.getItem("completed_evaluations") || "[]");
    const loadedList: ScoreCard[] = [];

    savedKeys.forEach((key) => {
      // Handle keys with and without _case suffix for legacy compatibility
      const storageKey = key.includes("_case") ? `eval_${key}` : `eval_${key}`;
      const savedCard = localStorage.getItem(storageKey);
      if (savedCard) {
        try {
          loadedList.push(JSON.parse(savedCard));
        } catch (e) {
          console.error(e);
        }
      }
    });

    setEvaluations(loadedList);
    if (loadedList.length > 0) {
      setSelectedEvalKey(savedKeys[0]);
    } else {
      setSelectedEvalKey("");
    }
  };

  const executeClearAllSaved = () => {
    fetch("/api/scores/clear", { method: "POST" })
      .then(() => {
        localStorage.removeItem("completed_evaluations");
        // Clear all possible combinations
        CANDIDATES.forEach((c) => {
          INSTRUCTORS.forEach((inst) => {
            localStorage.removeItem(`eval_${c.id}_${inst.id}`);
            localStorage.removeItem(`eval_${c.id}_${inst.id}_case0`);
            localStorage.removeItem(`eval_${c.id}_${inst.id}_case1`);
          });
        });
        setEvaluations([]);
        setSelectedEvalKey("");
        setClearStatus("✅ 數據重設已成功同步完成！");
        setShowConfirmClear(false);
        setTimeout(() => setClearStatus(null), 4000);
        loadEvaluations();
      })
      .catch((err) => {
        console.error("Failed clear scores on server. Clearing locally only: ", err);
        localStorage.removeItem("completed_evaluations");
        CANDIDATES.forEach((c) => {
          INSTRUCTORS.forEach((inst) => {
            localStorage.removeItem(`eval_${c.id}_${inst.id}`);
          });
        });
        setEvaluations([]);
        setSelectedEvalKey("");
        setClearStatus("⚠️ 伺服器離線，僅重整本機數據！");
        setShowConfirmClear(false);
        setTimeout(() => setClearStatus(null), 4000);
        loadEvaluations();
      });
  };

  const getActiveEvaluation = (): ScoreCard | null => {
    if (!selectedEvalKey) return null;
    return evaluations.find((e) => {
        const eKey = `${e.candidateId}_${e.evaluatorId}`;
        return eKey === selectedEvalKey || `${eKey}_case0` === selectedEvalKey || `${eKey}_case1` === selectedEvalKey;
    }) || null;
  };

  const activeEval = getActiveEvaluation();

  const handlePrint = () => {
    window.print();
  };

  const handleExportToExcel = () => {
    if (evaluations.length === 0) {
      alert("目前尚無已評閱數據可供匯出。");
      return;
    }

    // Define Excel-compatible CSV headers (Traditional Chinese)
    const headers = [
      "評核日期",
      "考生代碼",
      "考生姓名",
      "受訓醫院",
      "測試案例別",
      "評核考官",
      "總分等值百分比",
      "病史詢問得分",
      "身體檢查得分",
      "關鍵臆斷得分",
      "輔助檢查規劃得分",
      "鑑別診斷思維得分",
      "急診處置決策得分",
      "轉線照會溝通得分",
      "醫病與家屬諮商得分",
      "急診導師現場綜合評語"
    ];

    // Build row values
    const rows = evaluations.map((e) => {
      // Determine the case based on caseIdx property (fallback check based on existing key or property)
      const caseName = e.caseIdx === 1 
        ? "Case 2 (子宮破裂產前大出血)" 
        : "Case 1 (急診高鉀 BRASH 症候群)";

      // Calculating individual percentage metrics
      const historyPct = Math.round(((e.history.s1 + e.history.s2 + e.history.s3 + e.history.s4 + e.history.s5 + e.history.s6 + e.history.s7 + e.history.s8 + e.history.global) / 22) * 100);
      const physicalPct = Math.round(((e.physical.p1 + e.physical.p2 + e.physical.p3 + e.physical.p4 + e.physical.p5 + e.physical.global) / 15) * 100);
      const diagnosisPct = Math.round(((e.diagnosis.d1 + e.diagnosis.d2 + e.diagnosis.d3 + e.diagnosis.d4 + e.diagnosis.d5) / 5) * 100);
      const investigationPct = Math.round(((e.investigations.i1 + e.investigations.i2 + e.investigations.i3 + e.investigations.global) / 12) * 100);
      const differentialPct = Math.round(((e.differential.dd1 + e.differential.dd2 + e.differential.dd3 + e.differential.dd4 + e.differential.global) / 10) * 100);
      const treatmentPct = Math.round(((e.treatment.tx1 + e.treatment.tx2 + e.treatment.tx3 + e.treatment.tx4 + e.treatment.tx5 + e.treatment.global) / 17) * 100);
      const consultationPct = Math.round(((e.consultation.c1 + e.consultation.c2 + e.consultation.c3 + e.consultation.c4 + e.consultation.global) / 13) * 100);
      const counselingPct = Math.round(((e.counseling.co1 + e.counseling.co2 + e.counseling.co3 + e.counseling.co4 + e.counseling.co5 + e.counseling.global) / 10) * 100);

      // Sanitize fields to prevent break due to special punctuation or comma delimiters
      const cleanCandidateId = e.candidateId ? e.candidateId.replace(/,/g, " ") : "";
      const cleanCandidateName = e.candidateName ? e.candidateName.replace(/,/g, " ") : "";
      const cleanHospital = e.candidateHospital ? e.candidateHospital.replace(/,/g, " ") : "";
      const cleanEvaluatorName = e.evaluatorName ? e.evaluatorName.replace(/,/g, " ") : "";
      const cleanDate = e.date || "2026-05-22";

      // Escape quotes in feedback
      const escapedFeedback = (e.generalFeedback || "").replace(/"/g, '""').replace(/\r?\n|\r/g, " ");

      return [
        cleanDate,
        cleanCandidateId,
        cleanCandidateName,
        cleanHospital,
        caseName,
        cleanEvaluatorName,
        `${e.totalScore}%`,
        `${historyPct}%`,
        `${physicalPct}%`,
        `${diagnosisPct}%`,
        `${investigationPct}%`,
        `${differentialPct}%`,
        `${treatmentPct}%`,
        `${consultationPct}%`,
        `${counselingPct}%`,
        `"${escapedFeedback}"`
      ];
    });

    // Unicode Byte Order Mark (BOM) code is "\uFEFF", allowing Microsoft Excel to correctly open in UTF-8
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    
    // Create blob link and invoke client side click download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").substring(0, 19);
    link.setAttribute("download", `急診聯合住院醫師面試評分總表_${timestamp}.csv`);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper calculation for average scores to show the target baseline check
  const getDomainAverages = () => {
    if (evaluations.length === 0) return { historyAvg: 70, physicalAvg: 70, diagnosisAvg: 70, investigationsAvg: 70, differentialAvg: 70, treatmentAvg: 70, consultationAvg: 70, counselingAvg: 70 };
    
    return {
      historyAvg: Math.round((evaluations.reduce((acc, e) => acc + (e.history.s1+e.history.s2+e.history.s3+e.history.s4+e.history.s5+e.history.s6+e.history.s7+e.history.s8+e.history.global)/22, 0) / evaluations.length) * 100),
      physicalAvg: Math.round((evaluations.reduce((acc, e) => acc + (e.physical.p1+e.physical.p2+e.physical.p3+e.physical.p4+e.physical.p5+e.physical.global)/15, 0) / evaluations.length) * 100),
      diagnosisAvg: Math.round((evaluations.reduce((acc, e) => acc + (e.diagnosis.d1+e.diagnosis.d2+e.diagnosis.d3+e.diagnosis.d4+e.diagnosis.d5)/5, 0) / evaluations.length) * 100),
      investigationsAvg: Math.round((evaluations.reduce((acc, e) => acc + (e.investigations.i1+e.investigations.i2+e.investigations.i3+e.investigations.global)/12, 0) / evaluations.length) * 100),
      differentialAvg: Math.round((evaluations.reduce((acc, e) => acc + (e.differential.dd1+e.differential.dd2+e.differential.dd3+e.differential.dd4+e.differential.global)/10, 0) / evaluations.length) * 100),
      treatmentAvg: Math.round((evaluations.reduce((acc, e) => acc + (e.treatment.tx1+e.treatment.tx2+e.treatment.tx3+e.treatment.tx4+e.treatment.tx5+e.treatment.global)/17, 0) / evaluations.length) * 100),
      consultationAvg: Math.round((evaluations.reduce((acc, e) => acc + (e.consultation.c1+e.consultation.c2+e.consultation.c3+e.consultation.c4+e.consultation.global)/13, 0) / evaluations.length) * 100),
      counselingAvg: Math.round((evaluations.reduce((acc, e) => acc + (e.counseling.co1+e.counseling.co2+e.counseling.co3+e.counseling.co4+e.counseling.co5+e.counseling.global)/10, 0) / evaluations.length) * 100)
    };
  };

  const avgs = getDomainAverages();

  // Selected candidate's score metrics representation for SVG radar/spider charts
  const getSelectedEvalMetrics = (e: ScoreCard) => {
    return {
      history: Math.round(((e.history.s1+e.history.s2+e.history.s3+e.history.s4+e.history.s5+e.history.s6+e.history.s7+e.history.s8+e.history.global)/22) * 100),
      physical: Math.round(((e.physical.p1+e.physical.p2+e.physical.p3+e.physical.p4+e.physical.p5+e.physical.global)/15) * 100),
      diagnosis: Math.round(((e.diagnosis.d1+e.diagnosis.d2+e.diagnosis.d3+e.diagnosis.d4+e.diagnosis.d5)/5) * 100),
      investigations: Math.round(((e.investigations.i1+e.investigations.i2+e.investigations.i3+e.investigations.global)/12) * 100),
      differential: Math.round(((e.differential.dd1+e.differential.dd2+e.differential.dd3+e.differential.dd4+e.differential.global)/10) * 100),
      treatment: Math.round(((e.treatment.tx1+e.treatment.tx2+e.treatment.tx3+e.treatment.tx4+e.treatment.tx5+e.treatment.global)/17) * 100),
      consultation: Math.round(((e.consultation.c1+e.consultation.c2+e.consultation.c3+e.consultation.c4+e.consultation.global)/13) * 100),
      counseling: Math.round(((e.counseling.co1+e.counseling.co2+e.counseling.co3+e.counseling.co4+e.counseling.co5+e.counseling.global)/10) * 100)
    };
  };

  const currentMetrics = activeEval ? getSelectedEvalMetrics(activeEval) : { history: 0, physical: 0, diagnosis: 0, investigations: 0, differential: 0, treatment: 0, consultation: 0, counseling: 0 };

  return (
    <div className="space-y-6" id="analytics-and-reports-section">
      
      {/* Printable CSS Page Breaks wrapper */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area-certificate, #print-area-certificate * {
            visibility: visible;
          }
          #print-area-certificate {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 no-print">
        {/* Left column: Scored reports list */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col">
          <div className="border-b border-slate-100 p-5 bg-slate-50 flex justify-between items-center">
            <h4 className="font-sans font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <Clipboard className="w-4 h-4 text-teal-600" />
              已評閱考卷清單 ({evaluations.length})
            </h4>
            {showConfirmClear ? (
              <div className="flex items-center gap-1 bg-red-50 px-2 py-1 rounded-lg border border-red-200 animate-fade-in">
                <span className="text-[10px] font-bold text-red-700">確認清除？</span>
                <button
                  type="button"
                  onClick={executeClearAllSaved}
                  className="px-1.5 py-0.5 text-[9px] font-extrabold bg-red-600 hover:bg-red-700 text-white rounded cursor-pointer transition-all"
                >
                  是
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmClear(false)}
                  className="px-1.5 py-0.5 text-[9px] font-extrabold bg-slate-200 hover:bg-slate-300 text-slate-700 rounded cursor-pointer transition-all"
                >
                  否
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowConfirmClear(true)}
                className="text-[10px] font-bold text-red-650 hover:text-red-700 font-sans flex items-center gap-0.5 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                全部清除
              </button>
            )}
          </div>

          {clearStatus && (
            <div className="mx-3 mt-3 p-2 bg-teal-50 border border-teal-200 text-teal-800 rounded-xl text-xs font-semibold text-center animate-fade-in">
              {clearStatus}
            </div>
          )}

          {evaluations.length > 0 && (
            <div className="p-4 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 border-b border-slate-100 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleExportToExcel}
                className="w-full bg-gradient-to-r from-teal-650 to-emerald-650 hover:from-teal-700 hover:to-emerald-700 text-white font-extrabold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 border border-teal-600/30 shadow-sm cursor-pointer transition-all hover:scale-[1.01]"
              >
                <Download className="w-3.5 h-3.5 text-emerald-100 animate-pulse" />
                匯出 Excel 評分明細總表 (.csv)
              </button>
              <div className="text-[10px] text-slate-500 text-center font-medium">
                📊 自動導入 UTF-8 BOM 碼，Excel 開啟防中文亂碼
              </div>
            </div>
          )}

          <div className="p-3 divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {evaluations.length === 0 ? (
              <p className="p-6 text-center text-xs text-slate-400">目前尚無已完成的評核考卷。</p>
            ) : (
              evaluations.map((e) => {
                const key = `${e.candidateId}_${e.evaluatorId}`;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedEvalKey(key)}
                    className={`w-full text-left p-3.5 rounded-xl transition-all flex justify-between items-center ${
                      selectedEvalKey === key 
                        ? "bg-indigo-50 border border-indigo-150 shadow-xs" 
                        : "hover:bg-slate-55"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded bg-indigo-100 text-indigo-700 font-mono text-[9px] font-bold flex items-center justify-center">
                          {e.candidateId}
                        </span>
                        <span className="font-bold text-slate-850 text-xs">{e.candidateName}</span>
                      </div>
                      <span className="text-[10px] text-slate-450 block font-light">
                        考官: {e.evaluatorName} ({e.date})
                      </span>
                    </div>
                    
                    <div className="text-right">
                      <span className="text-sm font-bold font-mono text-teal-600 block leading-tight">
                        {e.totalScore}%
                      </span>
                      <span className="text-[9px] text-slate-400 uppercase font-mono bg-white border border-slate-100 px-1 py-0.5 rounded">
                        {e.candidateHospital}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right 2 columns: Spider radar metric visualization */}
        {activeEval ? (
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex justify-between items-start border-b pb-3 border-slate-100">
              <div>
                <h4 className="font-sans font-bold text-slate-800 text-sm flex items-center gap-2">
                  <BarChart4 className="w-4.5 h-4.5 text-indigo-600" />
                  急診八大核心能力雷達模擬圖 & 科部表現指標拼圖
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  對抗標準合格基準線，了解 <strong>{activeEval.candidateName} 醫師</strong> 的優缺點細節。
                </p>
              </div>
              <span className="px-3 py-1 text-xs font-bold font-mono bg-slate-900 text-teal-300 rounded mb-2">
                綜合指標：{activeEval.totalScore}%
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              
              {/* Radial competency web custom SVG */}
              <div className="md:col-span-6 flex justify-center">
                <svg width="220" height="220" viewBox="0 0 220 220" className="overflow-visible font-sans text-[8px] font-semibold text-slate-500">
                  {/* Grid circle layers (0.2, 0.4, 0.6, 0.8, 1.0) */}
                  <circle cx="110" cy="110" r="20" fill="none" stroke="#e2e8f0" strokeDasharray="2 2" />
                  <circle cx="110" cy="110" r="40" fill="none" stroke="#e2e8f0" strokeDasharray="2 2" />
                  <circle cx="110" cy="110" r="60" fill="none" stroke="#cbd5e1" />
                  <circle cx="110" cy="110" r="80" fill="none" stroke="#cbd5e1" strokeWidth="1.5" />
                  
                  {/* Web Axes Lines */}
                  <line x1="110" y1="30" x2="110" y2="190" stroke="#cbd5e1" />
                  <line x1="30" y1="110" x2="190" y2="110" stroke="#cbd5e1" />
                  <line x1="53.4" y1="53.4" x2="166.6" y2="166.6" stroke="#cbd5e1" strokeDasharray="1 1" />
                  <line x1="53.4" y1="166.6" x2="166.6" y2="53.4" stroke="#cbd5e1" strokeDasharray="1 1" />

                  {/* Labels and values placement */}
                  <text x="110" y="24" textAnchor="middle" className="fill-slate-800">1. 病史 ({currentMetrics.history}%)</text>
                  <text x="180" y="55" textAnchor="start">2. 檢體 ({currentMetrics.physical}%)</text>
                  <text x="195" y="113" textAnchor="start">3. 臆斷 ({currentMetrics.diagnosis}%)</text>
                  <text x="180" y="170" textAnchor="start">4. 檢查 ({currentMetrics.investigations}%)</text>
                  <text x="110" y="198" textAnchor="middle" className="fill-slate-800">5. 鑑別 ({currentMetrics.differential}%)</text>
                  <text x="40" y="170" textAnchor="end">6. 治療 ({currentMetrics.treatment}%)</text>
                  <text x="25" y="113" textAnchor="end">7. 照會 ({currentMetrics.consultation}%)</text>
                  <text x="40" y="55" textAnchor="end">8. 諮商 ({currentMetrics.counseling}%)</text>

                  {/* AVG Target baseline polygon */}
                  <polygon 
                    points={`
                      110,${110 - avgs.historyAvg * 0.8}
                      ${110 + avgs.physicalAvg * 0.8 * 0.707},${110 - avgs.physicalAvg * 0.8 * 0.707}
                      ${110 + avgs.diagnosisAvg * 0.8},110
                      ${110 + avgs.investigationsAvg * 0.8 * 0.707},${110 + avgs.investigationsAvg * 0.8 * 0.707}
                      110,${110 + avgs.differentialAvg * 0.8}
                      ${110 - avgs.treatmentAvg * 0.8 * 0.707},${110 + avgs.treatmentAvg * 0.8 * 0.707}
                      ${110 - avgs.consultationAvg * 0.8},110
                      ${110 - avgs.counselingAvg * 0.8 * 0.707},${110 - avgs.counselingAvg * 0.8 * 0.707}
                    `}
                    fill="rgba(148, 163, 184, 0.2)"
                    stroke="#94a3b8"
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                  />

                  {/* Candidate competent polygon path */}
                  <polygon 
                    points={`
                      110,${110 - currentMetrics.history * 0.8}
                      ${110 + currentMetrics.physical * 0.8 * 0.707},${110 - currentMetrics.physical * 0.8 * 0.707}
                      ${110 + currentMetrics.diagnosis * 0.8},110
                      ${110 + currentMetrics.investigations * 0.8 * 0.707},${110 + currentMetrics.investigations * 0.8 * 0.707}
                      110,${110 + currentMetrics.differential * 0.8}
                      ${110 - currentMetrics.treatment * 0.8 * 0.707},${110 + currentMetrics.treatment * 0.8 * 0.707}
                      ${110 - currentMetrics.consultation * 0.8},110
                      ${110 - currentMetrics.counseling * 0.8 * 0.707},${110 - currentMetrics.counseling * 0.8 * 0.707}
                    `}
                    fill="rgba(122, 139, 126, 0.4)"
                    stroke="#7A8B7E"
                    strokeWidth="2.5"
                  />
                  
                  <circle cx="110" cy="110" r="3" fill="#7A8B7E" />
                </svg>
              </div>

              {/* Competent indices details */}
              <div className="md:col-span-6 space-y-3 font-sans text-xs">
                <span className="text-[10px] font-bold text-slate-400 block tracking-widest uppercase">
                  Legend & Competency Benchmarks
                </span>
                
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 bg-teal-600/30 border border-teal-700 rounded" />
                  <span className="text-slate-700 font-medium">該受評生各能力百分比 (Candidate Profile)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 bg-slate-300/30 border border-slate-400 border-dashed rounded" />
                  <span className="text-slate-500 font-medium">
                    本場工作坊全體均值基準線 (Workshop Avg: {evaluations.length > 0 ? Math.round(evaluations.reduce((acc,ev)=>acc+ev.totalScore,0)/evaluations.length) : 0}%)
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-150 mt-4 leading-relaxed text-[11px] text-slate-500">
                  💡 <strong>導師雷達建議：</strong>
                  {currentMetrics.treatment < 70 ? (
                    <span> 考生在「治療處置」上得分較低。在合併 Unstable Bradycardia & 高血鉀時，應注意防線，<strong>不可漏失靜脈注射 Calcium Gluconate</strong>。</span>
                  ) : currentMetrics.counseling < 70 ? (
                    <span> 考生在「家屬溝通」上得分較低。急診病情不確定高，應多練習與焦虑家屬會谈、雙重複核家屬理解。</span>
                  ) : (
                    <span> 該考生雷達圖外展流暢且對稱，反映其不但在治療技能純熟，更能將病史、生理檢查、照會和病因病理（BRASH 機制）串連得非常好。</span>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => onSelectCandidate(activeEval.candidateId)}
                    className="flex-1 py-2 px-3 bg-slate-100 hover:bg-indigo-100 font-bold hover:text-indigo-800 text-slate-700 rounded-lg text-center transition-all cursor-pointer"
                  >
                    開啟面試評分工作站
                  </button>
                  <button
                    onClick={handlePrint}
                    className="py-2 px-3 bg-teal-650 hover:bg-teal-700 text-white rounded-lg flex items-center justify-center gap-1 cursor-pointer font-bold animate-pulse"
                  >
                    <Printer className="w-4 h-4" /> 印出評核單
                  </button>
                  <button
                    onClick={() => setShowConfirmClear(true)}
                    className="py-2 px-3 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg flex items-center justify-center gap-1 cursor-pointer font-bold transition-all"
                  >
                    <Trash2 className="w-4 h-4" /> 清除數據
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 bg-slate-50/50 border border-slate-200 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-4 min-h-[460px]">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 text-indigo-500">
              <BarChart4 className="w-6 h-6 stroke-1 animate-pulse" />
            </div>
            <div>
              <h4 className="font-sans font-bold text-slate-800 text-sm">
                目前尚未選取或登入任何評分紀錄
              </h4>
              <p className="text-[11px] text-slate-450 mt-1 max-w-sm mx-auto leading-relaxed">
                考量現場合規公平性，大會資料庫預設為空白。請先對左側<b>【評閱考卷清單】</b>點選指定考生的歷史考單，或點選下方按鈕前往<b>【住院醫師評核表】</b>為现场新考生送出評核分數。
              </p>
            </div>
            <button
              onClick={() => onSelectCandidate(CANDIDATES[0]?.id || "A1")}
              className="py-2 px-4 bg-teal-650 hover:bg-teal-700 text-white font-bold rounded-xl text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Clipboard className="w-3.5 h-3.5" />
              前往現場考生評估工作站
            </button>
          </div>
        )}
      </div>

      {/* Standard Certificate / Candidate Report Layout for Printing */}
      {activeEval && (
        <div 
          id="print-area-certificate" 
          className="bg-white border-2 border-slate-350 rounded-2xl p-8 sm:p-12 shadow-sm space-y-8 max-w-4xl mx-auto"
        >
          {/* Official Letterhead */}
          <div className="text-center space-y-2 border-b-2 border-double border-slate-300 pb-6">
            <div className="inline-flex gap-2 text-indigo-700 uppercase font-mono text-[11px] tracking-widest font-extrabold pb-1">
              <span>National EM Resident Joint Mock Exam</span>
              <span>•</span>
              <span>2026 年度聯合住院醫師面試</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-sans">
              急診醫學部聯合住院醫師面試考生回饋單
            </h2>
                <p className="text-xs text-slate-400 animate-slide">
                  【 新型個別面試試場 — {selectedEvalKey.includes("_case1") ? "Case 2" : "Case 1"} 病例與醫病理脈絡評核 】
                </p>
          </div>

          {/* Identity Info Panel */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-sans">
            <div>
              <span className="text-slate-400 font-mono block">受評住院醫師 Candidate</span>
              <span className="font-extrabold text-slate-900 text-sm">{activeEval.candidateName}</span>
            </div>
            <div>
              <span className="text-slate-400 font-mono block">附屬部屬 Hospital</span>
              <span className="font-bold text-slate-800 text-sm">{activeEval.candidateHospital} 醫院急診醫學部</span>
            </div>
            <div>
              <span className="text-slate-400 font-mono block">主持評審考官 Evaluator</span>
              <span className="font-extrabold text-slate-900 text-sm">{activeEval.evaluatorName}</span>
            </div>
            <div>
              <span className="text-slate-400 font-mono block">評分日期 Date</span>
              <span className="font-semibold text-slate-800 text-sm font-mono">{activeEval.date}</span>
            </div>
          </div>

          {/* Diagnostic Case info description */}
          <div className="border border-teal-150 bg-teal-50/25 p-4 rounded-xl text-xs font-sans text-teal-950">
            <strong>面試評量情境說明：</strong> 81歲高齡女性。來診主訴為「胸痛、全身無力」，伴隨顯著竇性心動過緩（HR 35下/分）、血壓偏低（90/50 mmHg）、口腔黏膜乾燥。實驗室報告指出 K=6.8 mmol/L（高尖 T 波）、Creatinine=2.8 mg/dL、近期服用 Sacubitril/Valsartan 與 Bisoprolol 及 Spironolactone。
            本病例極大死結在於 <strong>BRASH Syndrome (Bradycardia, Renal failure, AV nodal blockers, Shock, Hyperkalemia)</strong> 三重加重，考驗考生是否能即刻跳脫一般常規洗腎/起搏思維，同步斷藥、補水並及早給隨 <strong>Calcium (鈣劑)</strong> 穩定心室肌。
          </div>

          {/* Sectional Performance Grids */}
          <div className="space-y-4">
            <h4 className="font-sans font-bold text-slate-800 text-sm border-b pb-2">
              八大核心領域行為指標複選結果 (Checked Rubrics Breakdown)
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-xs font-sans">
              
              {/* Box 1: History */}
              <div className="space-y-1 bg-slate-50/55 p-3 rounded-lg border">
                <div className="flex justify-between font-bold text-slate-800 pb-1 border-b border-dashed">
                  <span>一、病史詢問 (History)</span>
                  <span className="font-mono text-teal-700">{Math.round((activeEval.history.s1+activeEval.history.s2+activeEval.history.s3+activeEval.history.s4+activeEval.history.s5+activeEval.history.s6+activeEval.history.s7+activeEval.history.s8+activeEval.history.global)/22 * 23)}分 / 23分(滿)</span>
                </div>
                <div className="text-[10px] text-slate-500 space-y-0.5 pt-1.5">
                  <div className="flex justify-between">
                    <span>• 症狀時間/特徵/低灌流詢問</span>
                    <span className="font-bold">[{activeEval.history.s1 + activeEval.history.s2 + activeEval.history.s3}/6]</span>
                  </div>
                  <div className="flex justify-between">
                    <span>• 脫水、藥物史、重複服藥、家庭功能</span>
                    <span className="font-bold">[{activeEval.history.s4 + activeEval.history.s5 + activeEval.history.s6 + activeEval.history.s7 + activeEval.history.s8}/9]</span>
                  </div>
                  <div className="flex justify-between">
                    <span>• 病史整體評鑑等級 (Global Rating L1-L4)</span>
                    <span className="font-bold font-mono">L{Math.min(4, Math.max(1, Math.round(activeEval.history.global/2)))} [{activeEval.history.global}/7]</span>
                  </div>
                </div>
              </div>

              {/* Box 2: PE */}
              <div className="space-y-1 bg-slate-50/55 p-3 rounded-lg border">
                <div className="flex justify-between font-bold text-slate-800 pb-1 border-b border-dashed">
                  <span>二、身體檢查 (Physical Exam)</span>
                  <span className="font-mono text-teal-700">{Math.round((activeEval.physical.p1+activeEval.physical.p2+activeEval.physical.p3+activeEval.physical.p4+activeEval.physical.p5+activeEval.physical.global)/15 * 15)}分 / 15分(滿)</span>
                </div>
                <div className="text-[10px] text-slate-500 space-y-0.5 pt-1.5">
                  <div className="flex justify-between">
                    <span>• 胸部聽診、心臟與低灌流循環 CRT 評估</span>
                    <span className="font-bold">[{activeEval.physical.p1+activeEval.physical.p2}/4]</span>
                  </div>
                  <div className="flex justify-between">
                    <span>• 體液水分、腹部感染來源與神經反應</span>
                    <span className="font-bold">[{activeEval.physical.p3+activeEval.physical.p4+activeEval.physical.p5}/6]</span>
                  </div>
                  <div className="flex justify-between">
                    <span>• 理學檢查整體診察整合核心</span>
                    <span className="font-bold">[{activeEval.physical.global}/5]</span>
                  </div>
                </div>
              </div>

              {/* Box 3: Impressions */}
              <div className="space-y-1 bg-slate-50/55 p-3 rounded-lg border">
                <div className="flex justify-between font-bold text-slate-800 pb-1 border-b border-dashed">
                  <span>三、初步臆斷合理性 (Impression)</span>
                  <span className="font-mono text-teal-700">{activeEval.diagnosis.d1+activeEval.diagnosis.d2+activeEval.diagnosis.d3+activeEval.diagnosis.d4+activeEval.diagnosis.d5}分 / 5分(滿)</span>
                </div>
                <div className="text-[10px] text-slate-500 pt-1.5 flex flex-wrap gap-1.5">
                  <span className={`px-1 py-0.5 rounded ${activeEval.diagnosis.d1 ? "bg-teal-100 text-teal-800" : "bg-slate-100 text-slate-400"}`}>慢心率</span>
                  <span className={`px-1 py-0.5 rounded ${activeEval.diagnosis.d2 ? "bg-teal-100 text-teal-800" : "bg-slate-100 text-slate-400"}`}>藥物誘發</span>
                  <span className={`px-1 py-0.5 rounded ${activeEval.diagnosis.d3 ? "bg-teal-100 text-teal-800" : "bg-slate-100 text-slate-400"}`}>電解質</span>
                  <span className={`px-1 py-0.5 rounded ${activeEval.diagnosis.d4 ? "bg-teal-100 text-teal-800" : "bg-slate-100 text-slate-400"}`}>脫水休克</span>
                  <span className={`px-1 py-0.5 rounded ${activeEval.diagnosis.d5 ? "bg-teal-100 text-teal-800" : "bg-slate-100 text-slate-400"}`}>ACS</span>
                </div>
              </div>

              {/* Box 4: Investigations */}
              <div className="space-y-1 bg-slate-50/55 p-3 rounded-lg border">
                <div className="flex justify-between font-bold text-slate-800 pb-1 border-b border-dashed">
                  <span>四、安排檢查與判讀 (Labs)</span>
                  <span className="font-mono text-teal-700">{Math.round((activeEval.investigations.i1+activeEval.investigations.i2+activeEval.investigations.i3+activeEval.investigations.global)/12 * 10)}分 / 10分(滿)</span>
                </div>
                <div className="text-[10px] text-slate-500 space-y-0.5 pt-1.5">
                  <div className="flex justify-between">
                    <span>• EKG 竇緩/高聳波對比</span>
                    <span className="font-bold">{activeEval.investigations.i1 ? "有判心律" : "未判讀"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>• 血液生化、尿量、VBG 酸血、CXR 肺野</span>
                    <span className="font-bold">[{activeEval.investigations.i2+activeEval.investigations.i3}/3]</span>
                  </div>
                  <div className="flex justify-between">
                    <span>• 整體檢驗數據整合等級比</span>
                    <span className="font-bold">[{activeEval.investigations.global}/8]</span>
                  </div>
                </div>
              </div>

              {/* Box 5: Diff Diags */}
              <div className="space-y-1 bg-slate-50/55 p-3 rounded-lg border">
                <div className="flex justify-between font-bold text-slate-800 pb-1 border-b border-dashed">
                  <span>五、鑑別診斷 (D.D.)</span>
                  <span className="font-mono text-teal-700">{Math.round((activeEval.differential.dd1+activeEval.differential.dd2+activeEval.differential.dd3+activeEval.differential.dd4+activeEval.differential.global)/10 * 10)}分 / 10分(滿)</span>
                </div>
                <div className="text-[10px] text-slate-500 space-y-0.5 pt-1.5">
                  <div className="flex justify-between">
                    <span>• 辨識核心 BRASH syndrome機制 (3分)</span>
                    <span className="font-bold">[{activeEval.differential.dd1}/3]</span>
                  </div>
                  <div className="flex justify-between">
                    <span>• 其他合併 D.D. (藥、高鉀、脫水AKI)</span>
                    <span className="font-bold">[{activeEval.differential.dd2+activeEval.differential.dd3+activeEval.differential.dd4}/3]</span>
                  </div>
                  <div className="flex justify-between">
                    <span>• 鑑別診斷重要排序邏輯度</span>
                    <span className="font-bold">[{activeEval.differential.global}/4]</span>
                  </div>
                </div>
              </div>

              {/* Box 6: Tx */}
              <div className="space-y-1 bg-slate-50/55 p-3 rounded-lg border">
                <div className="flex justify-between font-bold text-slate-800 pb-1 border-b border-dashed">
                  <span>六、治療處置 (Management)</span>
                  <span className="font-mono text-teal-700">{Math.round((activeEval.treatment.tx1+activeEval.treatment.tx2+activeEval.treatment.tx3+activeEval.treatment.tx4+activeEval.treatment.tx5+activeEval.treatment.global)/17 * 17)}分 / 17分(滿)</span>
                </div>
                <div className="text-[10px] text-slate-500 space-y-0.5 pt-1.5">
                  <div className="flex justify-between">
                    <span>• 基礎穩定氧 / bradycardia給藥&起搏 (TCP)</span>
                    <span className="font-bold">[{activeEval.treatment.tx1+activeEval.treatment.tx2}/4]</span>
                  </div>
                  <div className="flex justify-between flex-wrap text-rose-700 font-semibold">
                    <span>★ 穩定心肌 Calcium / 停藥補液 (重考點!)</span>
                    <span className="font-bold">[{activeEval.treatment.tx3+activeEval.treatment.tx5}/4]</span>
                  </div>
                  <div className="flex justify-between">
                    <span>• 多途徑降血鉀處置安排 / 處法整體等級</span>
                    <span className="font-bold">[{activeEval.treatment.tx4 + activeEval.treatment.global}/9]</span>
                  </div>
                </div>
              </div>

              {/* Box 7: Consult */}
              <div className="space-y-1 bg-slate-50/55 p-3 rounded-lg border">
                <div className="flex justify-between font-bold text-slate-800 pb-1 border-b border-dashed">
                  <span>七、照會溝通 (Consultation)</span>
                  <span className="font-mono text-teal-700">{Math.round((activeEval.consultation.c1+activeEval.consultation.c2+activeEval.consultation.c3+activeEval.consultation.c4+activeEval.consultation.global)/13 * 10)}分 / 10分(滿)</span>
                </div>
                <div className="text-[10px] text-slate-500 space-y-0.5 pt-1.5">
                  <div className="flex justify-between">
                    <span>• 心臟科、腎臟科與 ICU 的照會決策</span>
                    <span className="font-bold">[{activeEval.consultation.c1+activeEval.consultation.c2+activeEval.consultation.c3}/3]</span>
                  </div>
                  <div className="flex justify-between">
                    <span>• 使用 ISBAR 口頭轉線報告表現</span>
                    <span className="font-bold">[{activeEval.consultation.c4}/5]</span>
                  </div>
                  <div className="flex justify-between">
                    <span>• 照會與後線溝通整體整合評價</span>
                    <span className="font-bold">[{activeEval.consultation.global}/5]</span>
                  </div>
                </div>
              </div>

              {/* Box 8: Counseling */}
              <div className="space-y-1 bg-slate-50/55 p-3 rounded-lg border">
                <div className="flex justify-between font-bold text-slate-850 pb-1 border-b border-dashed">
                  <span>八、醫病諮商與家屬解說 (Counseling)</span>
                  <span className="font-mono text-teal-750">{Math.round((activeEval.counseling.co1+activeEval.counseling.co2+activeEval.counseling.co3+activeEval.counseling.co4+activeEval.counseling.co5+activeEval.counseling.global)/10 * 10)}分 / 10分(滿)</span>
                </div>
                <div className="text-[10px] text-slate-500 space-y-0.5 pt-1.5">
                  <div className="flex justify-between">
                    <span>• 建立關係、危急說明、機製解說</span>
                    <span className="font-bold">[{activeEval.counseling.co1+activeEval.counseling.co2+activeEval.counseling.co3}/3]</span>
                  </div>
                  <div className="flex justify-between">
                    <span>• 治療後續、家屬情緒安撫與理解複核</span>
                    <span className="font-bold">[{activeEval.counseling.co4+activeEval.counseling.co5}/2]</span>
                  </div>
                  <div className="flex justify-between">
                    <span>• 諮商溝通整體行為評價</span>
                    <span className="font-bold">[{activeEval.counseling.global}/5]</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Core feedback panel */}
          <div className="p-6 bg-slate-50 border border-slate-205 rounded-xl space-y-2">
            <span className="text-[10px] font-bold text-slate-400 block font-mono">
              臨床培育導師評核建議 (Clinical Mentoring Feedback)
            </span>
            <p className="text-xs text-slate-800 font-sans leading-relaxed whitespace-pre-line">
              {activeEval.generalFeedback ? activeEval.generalFeedback : "無特定評語。"}
            </p>
          </div>

          {/* Graduation and Signatures banner */}
          <div className="pt-8 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row justify-between items-end gap-6 text-xs font-sans">
              <div className="space-y-1">
                <span className="text-slate-400 block font-mono">備註 / 印製機關</span>
                <span className="font-bold text-slate-700 block">台北國泰綜合醫院 ＆ 臺大部急診聯合教學委員會</span>
                <span className="text-[10px] text-slate-400 font-light font-mono block">Certificate Hash Index: SHA-e2b26005c_R33</span>
              </div>
              
              <div className="flex gap-8">
                <div className="border-b border-slate-300 w-32 pb-1 text-center font-sans space-y-4">
                  <span className="text-[10px] text-slate-400 block font-mono">考生確認簽字</span>
                  <div className="h-4" />
                </div>
                <div className="border-b border-indigo-200 w-32 pb-1 text-center font-sans space-y-4">
                  <span className="text-[10px] text-indigo-400 block font-mono">導師考官簽字</span>
                  <span className="font-mono text-indigo-900 font-bold block italic">{activeEval.evaluatorName}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
