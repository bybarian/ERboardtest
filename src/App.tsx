import React, { useState, startTransition } from "react";
import WorkShopDashboard from "./components/WorkShopDashboard";
import ClinicalScenario from "./components/ClinicalScenario";
import CandidateScorer from "./components/CandidateScorer";
import ScoreAnalytics from "./components/ScoreAnalytics";
import { 
  Activity, CheckSquare, BarChart3, FileText, LayoutGrid, Lock, KeyRound, Upload, Trash2
} from "lucide-react";

function PinCodeLock({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  const handleKeyPress = (num: string) => {
    setError(false);
    if (pin.length < 5) {
      setPin(prev => prev + num);
    }
  };

  const handleBackspace = () => {
    setError(false);
    setPin(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setError(false);
    setPin("");
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pin === "00000") {
      onUnlock();
    } else {
      setError(true);
      setPin("");
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 bg-white border border-slate-200 rounded-2xl p-8 shadow-md text-center space-y-6 animate-fade-in" id="pin-lock-gate">
      <div className="mx-auto w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100">
        <Lock className="w-6 h-6 animate-pulse" />
      </div>
      <div>
        <h3 className="font-sans font-extrabold text-slate-900 text-base">
          考官專屬工作區授權 (Examiner Pin Authorization)
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          本區段包含核心評分工作站與考生雷達報表，請鍵入工作坊授權 PIN 碼以解鎖進度
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Passcode display dots */}
        <div className="flex justify-center gap-3">
          {[0, 1, 2, 3, 4].map((idx) => (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                pin.length > idx
                  ? "bg-slate-800 border-slate-800 scale-110"
                  : error
                  ? "border-rose-400 bg-rose-50"
                  : "border-slate-300 bg-slate-50"
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-[11px] text-rose-600 font-bold">
            ❌ 授權密碼錯誤，請重新輸入！
          </p>
        )}

        <input
          type="password"
          maxLength={5}
          value={pin}
          readOnly
          className="sr-only"
        />

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-2.5 max-w-[240px] mx-auto pt-2">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleKeyPress(num)}
              className="w-full h-12 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-800 font-bold rounded-xl text-md border border-slate-200 transition-all flex items-center justify-center cursor-pointer"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="w-full h-12 text-slate-450 hover:text-slate-700 font-semibold rounded-xl text-xs flex items-center justify-center cursor-pointer"
          >
            清除
          </button>
          <button
            type="button"
            onClick={() => handleKeyPress("0")}
            className="w-full h-12 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-800 font-bold rounded-xl text-md border border-slate-200 transition-all flex items-center justify-center cursor-pointer"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="w-full h-12 text-slate-450 hover:text-slate-700 font-semibold rounded-xl text-xs flex items-center justify-center cursor-pointer"
          >
            退格
          </button>
        </div>

        <button
          type="submit"
          className="w-full max-w-[240px] mx-auto py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-4"
        >
          <KeyRound className="w-4 h-4" />
          確認授權碼 (Verify PIN)
        </button>
      </form>
    </div>
  );
}

export default function App() {
  const [activeView, setActiveView] = useState<"dashboard" | "scenario" | "scorer" | "analytics">("dashboard");
  const [currentCaseIdx, setCurrentCaseIdx] = useState<number>(0);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>("A1");
  const [evaluationTrigger, setEvaluationTrigger] = useState<number>(0);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [logoFailed, setLogoFailed] = useState<boolean>(false);
  const [customLogo, setCustomLogo] = useState<string | null>(() => {
    return localStorage.getItem("custom_logo");
  });

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          localStorage.setItem("custom_logo", result);
          setCustomLogo(result);
          setLogoFailed(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetLogo = (e: React.MouseEvent) => {
    e.stopPropagation();
    localStorage.removeItem("custom_logo");
    setCustomLogo(null);
    setLogoFailed(false);
  };

  // When instructor clicks 'Start Scoring' on candidate row in Dashboard
  const handleStartScoring = (id: string) => {
    setSelectedCandidateId(id);
    startTransition(() => {
      setActiveView("scorer");
    });
  };

  // Callback to refresh graphs & completed count when a new test scorecard is stored
  const handleEvaluationSaved = () => {
    setEvaluationTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-teal-500 selection:text-white antialiased" id="app-root">
      
      {/* Dynamic Header Block (No Larping/Anti-flicker style) */}
      <header className="bg-white border-b border-slate-200 py-4 px-6 sticky top-0 z-40 shadow-xs no-print">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          
          <div className="flex items-center gap-3">
            <div className="relative group flex items-center">
              {customLogo ? (
                <div className="relative">
                  <img
                    src={customLogo}
                    alt="Custom Logo"
                    className="h-10 w-auto object-contain shrink-0 max-w-[120px] rounded-lg border border-slate-200/60 p-0.5"
                  />
                  <button
                    onClick={handleResetLogo}
                    title="回復預設 Logo"
                    className="absolute -top-1.5 -right-1.5 bg-rose-500 hover:bg-rose-600 text-white p-0.5 rounded-full shadow-md z-10 transition-transform hover:scale-110 cursor-pointer"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                </div>
              ) : !logoFailed ? (
                <img
                  src="logo.png"
                  alt="Logo"
                  className="h-10 w-auto object-contain shrink-0 max-w-[120px]"
                  onError={(e) => {
                    const tgt = e.currentTarget;
                    if (tgt.src.endsWith('logo.png')) {
                      tgt.src = 'logo.jpg';
                    } else if (tgt.src.endsWith('logo.jpg')) {
                      tgt.src = 'logo.svg';
                    } else {
                      setLogoFailed(true);
                    }
                  }}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 to-indigo-650 flex items-center justify-center text-white shadow-xs shrink-0">
                  <Activity className="w-5.5 h-5.5 animate-pulse text-teal-200" />
                </div>
              )}

              {/* Upload Overlay on Hover */}
              <label 
                htmlFor="logo-file-uploader" 
                className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex flex-col items-center justify-center gap-0.5 cursor-pointer text-white text-[8px] font-bold z-20 select-none text-center"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>上傳 Logo</span>
              </label>
              <input
                id="logo-file-uploader"
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
            </div>
            <div>
              <h1 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                2026年台北國泰醫院、臺大醫院急診醫學部聯合住院醫師面試工作坊
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-teal-100 text-teal-800 border border-teal-200 uppercase font-mono tracking-wider">
                  新型個別評核
                </span>
              </h1>
              <p className="text-[11px] text-slate-450 font-light flex items-center gap-1.5 mt-0.5">
                <span>主辦協同：台大急診醫學部 ＆ 國泰急診教學小組</span>
              </p>
            </div>
          </div>

          {/* Navigation Tab Controllers */}
          <div className="flex items-center gap-2 flex-wrap">
            <nav className="flex gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 pr-1">
              <button
                onClick={() => setActiveView("dashboard")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeView === "dashboard"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-550 hover:text-slate-800"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                考場監控
              </button>
              <button
                onClick={() => setActiveView("scenario")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeView === "scenario"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-550 hover:text-slate-800"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                病例情境
              </button>
              <button
                onClick={() => setActiveView("scorer")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeView === "scorer"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-550 hover:text-slate-800"
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5" />
                評分工作站
              </button>
              <button
                onClick={() => setActiveView("analytics")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeView === "analytics"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-550 hover:text-slate-800"
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                雷達報表
              </button>
            </nav>

            {isAuthorized && (
              <button
                onClick={() => {
                  setIsAuthorized(false);
                  setActiveView("dashboard");
                }}
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-bold transition-all bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 cursor-pointer"
              >
                <Lock className="w-3 h-3" />
                鎖定工作站
              </button>
            )}

            {/* Case Selection Toggle - Visible in Scenario and Scorer Views */}
            {(activeView === "scenario" || activeView === "scorer") && (
              <div className="flex bg-indigo-50 border border-indigo-100 rounded-xl p-0.5 ml-2">
                <button
                  onClick={() => setCurrentCaseIdx(0)}
                  className={`px-3 py-1 text-[10px] font-extrabold rounded-lg transition-all ${
                    currentCaseIdx === 0
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-indigo-400 hover:text-indigo-600"
                  }`}
                >
                  Case 1
                </button>
                <button
                  onClick={() => setCurrentCaseIdx(1)}
                  className={`px-3 py-1 text-[10px] font-extrabold rounded-lg transition-all ${
                    currentCaseIdx === 1
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-indigo-400 hover:text-indigo-600"
                  }`}
                >
                  Case 2
                </button>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* Main Workspace Body Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 transition-all">
        {activeView === "dashboard" && (
          <WorkShopDashboard onStartScoring={handleStartScoring} />
        )}
        
        {activeView === "scenario" && (
          <ClinicalScenario caseIdx={currentCaseIdx} />
        )}

        {activeView === "scorer" && (
          isAuthorized ? (
            <CandidateScorer 
              onEvaluationSaved={handleEvaluationSaved} 
              selectedCandidateId={selectedCandidateId}
              caseIdx={currentCaseIdx}
            />
          ) : (
            <PinCodeLock onUnlock={() => setIsAuthorized(true)} />
          )
        )}

        {activeView === "analytics" && (
          isAuthorized ? (
            <ScoreAnalytics 
              triggerCount={evaluationTrigger} 
              onSelectCandidate={handleStartScoring}
            />
          ) : (
            <PinCodeLock onUnlock={() => setIsAuthorized(true)} />
          )
        )}
      </main>

      {/* Global Footer (Print Hidden) */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 mt-12 text-center text-[10px] text-slate-400 font-mono no-print">
        <p>國泰綜合醫院教學部 數科網中心</p>
      </footer>

    </div>
  );
}
