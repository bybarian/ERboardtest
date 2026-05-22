import React, { useState, useEffect } from "react";
import { CASE_SCENARIOS } from "../data/workshopData";
import { 
  FileText, Activity, Layers, ShieldAlert, 
  Eye, EyeOff, Heart, Clipboard, Info, Lock, KeyRound
} from "lucide-react";

export default function ClinicalScenario({ caseIdx = 0 }: { caseIdx?: number }) {
  const [isExaminerMode, setIsExaminerMode] = useState<boolean>(false);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);

  const scenario = CASE_SCENARIOS[caseIdx] || CASE_SCENARIOS[0];
  const { patientProfile, labReport, clinicalLogic } = scenario;
  const isUterineRupture = scenario.id === "uterine-rupture";

  // Synchronized clinical information visibility toggles
  const [visibility, setVisibility] = useState({
    isHistoryRevealed: false,
    isLabsRevealed: false,
    isCxrRevealed: false,
    isBrashRevealed: false,
    isEcgRevealed: false,
  });

  const [selectedEcg, setSelectedEcg] = useState<"today" | "previous">("today");
  const [ecg1Failed, setEcg1Failed] = useState<boolean>(false);
  const [ecg2Failed, setEcg2Failed] = useState<boolean>(false);
  const [cxrFailed, setCxrFailed] = useState<boolean>(false);

  // Poll the scenario visibility state from the server to keep candidates' view instantly updated
  useEffect(() => {
    const fetchVisibility = () => {
      fetch("/api/scenario-visibility")
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.visibility) {
            setVisibility(data.visibility);
          }
        })
        .catch((err) => console.error("Error fetching scenario visibility:", err));
    };

    fetchVisibility();
    const interval = setInterval(fetchVisibility, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleVisibility = (key: keyof typeof visibility) => {
    const newVal = !visibility[key];
    fetch("/api/scenario-visibility", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: newVal }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.visibility) {
          setVisibility(data.visibility);
        }
      })
      .catch((err) => console.error("Error updating scenario visibility:", err));
  };

  const handlePinKeyPress = (num: string) => {
    setPinError(false);
    if (pin.length < 5) {
      setPin(prev => prev + num);
    }
  };

  const handlePinBackspace = () => {
    setPinError(false);
    setPin(prev => prev.slice(0, -1));
  };

  const handlePinClear = () => {
    setPinError(false);
    setPin("");
  };

  const handlePinSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pin === "00000") {
      setIsUnlocked(true);
      setPinError(false);
    } else {
      setPinError(true);
      setPin("");
    }
  };

  return (
    <div className="space-y-6" id="clinical-scenario-container">
      {/* View Controller Flag */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-slate-50 border border-slate-200 rounded-xl gap-4">
        <div>
          <h3 className="font-sans font-medium text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-teal-600" />
            <span>臨床案例模擬工作站 (Clinical Simulation)</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            本案例採「新型個別面試」格式。您可以切換考官與考生視角來進行模擬演練。
          </p>
        </div>
        <div className="inline-flex items-center gap-2 bg-white border border-slate-200 p-1.5 rounded-lg shadow-xs">
          <button
            id="candidate-view-btn"
            onClick={() => setIsExaminerMode(false)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
              !isExaminerMode 
                ? "bg-amber-100 text-amber-800 shadow-xs" 
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <EyeOff className="w-3.5 h-3.5" />
            考生視角 (試卷模式)
          </button>
          <button
            id="examiner-view-btn"
            onClick={() => setIsExaminerMode(true)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
              isExaminerMode 
                ? "bg-teal-600 text-white shadow-xs" 
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            考官視角 (完整顯示)
          </button>
        </div>
      </div>

      {isExaminerMode && !isUnlocked ? (
        <div className="max-w-md mx-auto my-6 bg-white border border-slate-200 rounded-2xl p-8 shadow-sm text-center space-y-6 animate-fade-in" id="scenario-pin-lock-container">
          <div className="mx-auto w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 border border-teal-100">
            <KeyRound className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="font-sans font-extrabold text-slate-900 text-sm">
              考官視角安全驗證 (Instructor PIN Security)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              您正在開啟【考官專屬頁面】，此處包含所有密封報告控制器及核心答案。請鍵入授權碼解鎖：
            </p>
          </div>

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div className="flex justify-center gap-3">
              {[0, 1, 2, 3, 4].map((idx) => (
                <div
                  key={idx}
                  className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                    pin.length > idx
                      ? "bg-teal-600 border-teal-600 scale-110"
                      : pinError
                      ? "border-rose-400 bg-rose-50"
                      : "border-slate-300 bg-slate-50"
                  }`}
                />
              ))}
            </div>

            {pinError && (
              <p className="text-[11px] text-rose-600 font-bold">
                ❌ 授權密碼錯誤，請確保輸入正確密碼！
              </p>
            )}

            <div className="grid grid-cols-3 gap-2.5 max-w-[260px] mx-auto">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handlePinKeyPress(num)}
                  className="h-10 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-800 font-bold rounded-xl text-sm border border-slate-200 transition-all flex items-center justify-center cursor-pointer"
                >
                  {num}
                </button>
              ))}
              <button type="button" onClick={handlePinClear} className="h-10 text-slate-450 hover:text-slate-700 font-semibold rounded-xl text-xs flex items-center justify-center cursor-pointer">清除</button>
              <button type="button" onClick={() => handlePinKeyPress("0")} className="h-10 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-800 font-bold rounded-xl text-sm border border-slate-200 transition-all flex items-center justify-center cursor-pointer">0</button>
              <button type="button" onClick={handlePinBackspace} className="h-10 text-slate-450 hover:text-slate-700 font-semibold rounded-xl text-xs flex items-center justify-center cursor-pointer">退格</button>
            </div>

            <div className="flex justify-center gap-2 max-w-[260px] mx-auto pt-2">
              <button type="button" onClick={() => setIsExaminerMode(false)} className="flex-1 py-2 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer">取消</button>
              <button type="submit" className="flex-1 py-2 px-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1 cursor-pointer">
                <KeyRound className="w-3.5 h-3.5" />
                確認授權
              </button>
            </div>
          </form>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Content Area */}
            <div className="lg:col-span-2 space-y-6">
              {!isExaminerMode && patientProfile.candidatePrompt ? (
                /* Candidate Question Paper View */
                <div className="bg-white border-2 border-slate-300 rounded-lg shadow-lg overflow-hidden animate-fade-in relative">
                  <div className="absolute inset-0 pointer-events-none opacity-5 bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]" />
                  <div className="bg-slate-100 border-b border-slate-200 px-8 py-6 text-center">
                    <h2 className="text-xl font-serif font-bold text-slate-900 border-b-2 border-double border-slate-400 pb-2 inline-block">
                      {scenario.title}
                    </h2>
                    <p className="text-sm font-sans font-medium text-slate-600 mt-3">新型個別面試 - 考生試卷</p>
                  </div>
                  <div className="p-8 sm:p-12 space-y-8 font-serif text-slate-800 leading-relaxed text-lg">
                    <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 shadow-inner italic text-base">
                      {patientProfile.candidatePrompt.intro}
                    </div>
                    <div className="border-l-4 border-slate-400 pl-6 py-2">
                      {patientProfile.candidatePrompt.caseInfo}
                    </div>
                    <div className="space-y-4 font-sans font-medium text-base text-slate-700 bg-white/40 p-6 rounded-xl border border-slate-100">
                      {patientProfile.candidatePrompt.tasks.map((task, i) => (
                        <p key={i}>{task}</p>
                      ))}
                    </div>
                  </div>
                  <div className="bg-slate-50 border-t border-slate-200 px-8 py-4 text-center">
                    <p className="text-xs text-slate-400 font-mono">第 1 頁，共 1 頁</p>
                  </div>
                </div>
              ) : (
                /* Instructor Case Brief Card */
                <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
                  <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="p-2 bg-rose-50 rounded-lg text-rose-600">
                        <Heart className="w-5 h-5" />
                      </span>
                      <div>
                        <h4 className="font-sans font-semibold text-slate-900 text-base">急診主訴與現病史</h4>
                        <p className="text-xs text-slate-500">主治：{patientProfile.ageSex}（{scenario.topic.split('(')[0]}）</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full flex items-center gap-1 animate-pulse">
                      <ShieldAlert className="w-3 h-3" />
                      高危急等級 (Triage L2)
                    </span>
                  </div>
                  <div className="p-6 space-y-5">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-xs text-slate-400 block font-mono">年齡/性別</span>
                        <span className="font-medium text-slate-800 text-sm">{patientProfile.ageSex}</span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 block font-mono">主訴</span>
                        <span className="font-medium text-slate-800 text-sm">{patientProfile.chiefComplaint}</span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 block font-mono">意識狀態 (GCS)</span>
                        <span className="font-medium text-slate-850 text-sm font-semibold">{patientProfile.vitals.gcs}</span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 block font-mono">來診方式</span>
                        <span className="font-medium text-amber-700 text-sm">家人抱扶至急診櫃檯</span>
                      </div>
                    </div>
                    <p className="text-slate-700 text-sm leading-relaxed p-4 bg-slate-50/40 rounded-xl border border-dashed border-slate-200">
                      {patientProfile.presentIllness}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4">
                      <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs text-center">
                        <span className="text-xs text-slate-400 block">BP</span>
                        <span className="text-sm font-bold text-red-600 font-mono">{patientProfile.vitals.bp}</span>
                      </div>
                      <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs text-center border-l-4 border-l-rose-500">
                        <span className="text-xs text-slate-400 block">HR</span>
                        <span className="text-sm font-bold text-rose-600 font-mono animate-pulse">{patientProfile.vitals.hr}</span>
                      </div>
                      <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs text-center">
                        <span className="text-xs text-slate-400 block">BT</span>
                        <span className="text-sm font-medium text-slate-800 font-mono">{patientProfile.vitals.temp}</span>
                      </div>
                      <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs text-center">
                        <span className="text-xs text-slate-400 block">RR</span>
                        <span className="text-sm font-semibold text-slate-800 font-mono">{patientProfile.vitals.rr}</span>
                      </div>
                      <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs text-center">
                        <span className="text-xs text-slate-400 block">SpO₂</span>
                        <span className="text-sm font-medium text-teal-600 font-mono">{patientProfile.vitals.spo2}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Past History & Current Medications */}
              <div className="space-y-4">
                {isExaminerMode && (
                  <div className="flex justify-between items-center text-xs bg-slate-100 p-3 rounded-xl border border-slate-200">
                    <span className="font-semibold text-slate-700">考生病史與常規藥物狀態: {visibility.isHistoryRevealed ? "🟢 已公開" : "🔒 已密封"}</span>
                    <button 
                      onClick={() => handleToggleVisibility("isHistoryRevealed")} 
                      className="bg-indigo-600 hover:bg-indigo-750 text-white px-3 py-1 rounded text-xs font-bold transition-all shadow-sm"
                    >
                      切換病史與藥物權限
                    </button>
                  </div>
                )}

                {(isExaminerMode || visibility.isHistoryRevealed) ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                    <div className="bg-white border rounded-2xl p-6 shadow-xs border-slate-200">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-sans font-bold text-slate-800 text-sm flex items-center gap-1.5"><Clipboard className="w-4 h-4 text-indigo-500" />過去病史</h4>
                        <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-semibold">
                          {visibility.isHistoryRevealed ? "🟢 考生可視" : "🔒 考官專屬"}
                        </span>
                      </div>
                      <ul className="space-y-2">
                        {patientProfile.pastHistory.map((h, i) => (
                          <li key={i} className="text-xs text-slate-700 flex items-center gap-2 bg-slate-50 p-2 rounded border border-slate-100"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />{h}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-white border rounded-2xl p-6 shadow-xs border-slate-200">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-sans font-bold text-slate-800 text-sm flex items-center gap-1.5"><Info className="w-4 h-4 text-emerald-500" />常規藥物</h4>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">
                          {visibility.isHistoryRevealed ? "🟢 考生可視" : "🔒 考官專屬"}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {patientProfile.medications.map((med, i) => (
                          <div key={i} className="text-[11px] px-2.5 py-1.5 bg-slate-50 border border-slate-100 rounded-lg">{med}</div>
                        ))}
                        {patientProfile.medicationClue && (
                          <div className="text-[11px] p-2 bg-amber-50 border border-amber-100 text-amber-800 rounded-lg font-medium mt-1 leading-normal">
                            💡 線索提示：{patientProfile.medicationClue}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-8 text-center text-slate-400 text-xs italic flex flex-col items-center">
                    <Lock className="w-8 h-8 mb-2 opacity-20 text-slate-500" />
                    <span>過去病史與常規藥物資訊已密封。待考生口頭問診（如主動詢問用藥或病史）後，請考官一鍵解鎖。</span>
                  </div>
                )}
              </div>

              {/* ECG Section - Keep but handle visibility (Only for Case 1) */}
              {!isUterineRupture && (
                <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
                  <div className="border-b border-slate-150 bg-slate-50 p-4 flex justify-between items-center">
                    <h4 className="font-sans font-bold text-slate-800 text-sm flex items-center gap-2"><Activity className="w-4 h-4 text-rose-600" />心電圖判讀</h4>
                    {(isExaminerMode || visibility.isEcgRevealed) && (
                      <div className="inline-flex gap-1 bg-slate-200 p-0.5 rounded-lg border border-slate-300">
                        <button onClick={() => setSelectedEcg("today")} className={`px-2 py-1 text-[10px] font-bold rounded ${selectedEcg === "today" ? "bg-white" : ""}`}>當天</button>
                        <button onClick={() => setSelectedEcg("previous")} className={`px-2 py-1 text-[10px] font-bold rounded ${selectedEcg === "previous" ? "bg-white" : ""}`}>歷史</button>
                      </div>
                    )}
                  </div>
                  {isExaminerMode && (
                    <div className="px-4 py-2 bg-slate-100 border-b flex justify-between items-center text-[10px]">
                      <span>考生狀態: {visibility.isEcgRevealed ? "🟢 已公開" : "🔒 已密封"}</span>
                      <button onClick={() => handleToggleVisibility("isEcgRevealed")} className="bg-teal-600 text-white px-2 py-0.5 rounded text-[10px] font-bold">切換權限</button>
                    </div>
                  )}
                  {(isExaminerMode || visibility.isEcgRevealed) ? (
                    <div className="p-4 bg-slate-900 flex flex-col items-center justify-center animate-fade-in">
                      <img 
                        src={selectedEcg === "today" ? "/ecg1.png" : "/ecg2.png"} 
                        alt="ECG" 
                        className="max-h-64 border border-slate-700 bg-white" 
                        onError={(e) => {
                          const tgt = e.currentTarget;
                          if (tgt.src.endsWith('.png')) tgt.src = tgt.src.replace('.png', '.jpg');
                          else tgt.style.display = 'none';
                        }} 
                        referrerPolicy="no-referrer" 
                      />
                      <p className="text-white text-xs mt-2 font-mono">{selectedEcg === "today" ? "HR: 35 bpm" : "HR: 75 bpm"}</p>
                    </div>
                  ) : (
                    <div className="p-12 text-center bg-slate-50 text-slate-400 text-xs italic flex flex-col items-center">
                      <Lock className="w-8 h-8 mb-2 opacity-20" />
                      心電圖已密封，需口頭指示後由考官解除。
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column Labs and CXR */}
            <div className="space-y-6">
              {/* Labs Section */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
                <div className="border-b border-slate-150 bg-slate-50 px-5 py-4 flex items-center justify-between">
                  <h4 className="font-sans font-bold text-slate-800 text-sm flex items-center gap-1.5 font-semibold">
                    <Clipboard className="w-4 h-4 text-teal-600" />實驗室/輔助檢查報告
                  </h4>
                  <span className="text-[10px] bg-teal-100 text-teal-850 px-2.5 py-0.5 rounded-full font-semibold">
                    {visibility.isLabsRevealed ? "🟢 已公開" : "🔒 已密封"}
                  </span>
                </div>

                {isExaminerMode && (
                  <div className="flex justify-between items-center text-[10px] bg-slate-100 p-2.5 border-b border-slate-200">
                    <span className="font-semibold text-slate-700">考生狀態: {visibility.isLabsRevealed ? "🟢 考生可視" : "🔒 已密封"}</span>
                    <button 
                      onClick={() => handleToggleVisibility("isLabsRevealed")} 
                      className="bg-teal-600 hover:bg-teal-750 text-white px-2.5 py-0.5 md:py-1 rounded text-[10px] font-bold transition-all shadow-xs"
                    >
                      切換實驗室權限
                    </button>
                  </div>
                )}

                {(isExaminerMode || visibility.isLabsRevealed) ? (
                  <div className="p-4 space-y-2.5 animate-fade-in">
                    {Object.entries(labReport).map(([key, item]) => {
                      const typedItem = item as { val: string; unit: string; isCritical?: boolean; note?: string };
                      return (
                        <div 
                          key={key} 
                          className={`p-2.5 rounded-xl border text-[11px] font-mono flex flex-col gap-1 transition-all ${
                            typedItem.isCritical 
                              ? "bg-rose-50 border-rose-100 text-rose-800 shadow-3xs" 
                              : "bg-slate-50 border-slate-100 text-slate-700"
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-semibold uppercase text-slate-800">{key === "ua" ? "尿液分析 (UA)" : key === "ptPtt" ? "凝血功能 (PT/PTT)" : key === "bloodType" ? "血型" : key === "ultrasound" ? "超音波" : key.toUpperCase()}</span>
                            <span className="font-bold">{typedItem.val} {typedItem.unit}</span>
                          </div>
                          {typedItem.note && (
                            <span className="text-[9px] font-sans font-medium text-rose-600/90 pl-1 border-l border-rose-400 bg-rose-100/30 py-0.5 rounded">
                              🚨 {typedItem.note}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50 text-slate-400 text-xs italic flex flex-col items-center">
                    <Lock className="w-8 h-8 mb-2 opacity-20" />
                    <span>急診檢驗與抽血報告密封中。待考生提出抽血醫囑或超音波指示後，請考官一鍵解鎖。</span>
                  </div>
                )}
              </div>

              {/* CXR Section (Only for Case 1) */}
              {!isUterineRupture && (
                <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-5 space-y-4">
                  <h4 className="font-sans font-bold text-slate-800 text-sm flex items-center gap-1.5 font-semibold"><Activity className="w-4 h-4 text-emerald-600" />胸部 X 光 (CXR)</h4>
                  {isExaminerMode && (
                    <div className="flex justify-between items-center text-[10px] bg-slate-100 p-2 rounded">
                      <span>考生狀態: {visibility.isCxrRevealed ? "🟢 已公開" : "🔒 已密封"}</span>
                      <button onClick={() => handleToggleVisibility("isCxrRevealed")} className="bg-teal-600 text-white px-2 py-0.5 rounded text-[10px] font-bold">切換權限</button>
                    </div>
                  )}
                  {(isExaminerMode || visibility.isCxrRevealed) ? (
                    <div className="text-center animate-fade-in">
                      {!cxrFailed ? (
                        <img 
                          src="/cxr.png" 
                          alt="CXR" 
                          className="w-full max-h-40 object-contain rounded border bg-white" 
                          onError={(e) => {
                            const tgt = e.currentTarget;
                            if (tgt.src.endsWith('.png')) tgt.src = tgt.src.replace('.png', '.jpg');
                            else setCxrFailed(true);
                          }} 
                          referrerPolicy="no-referrer" 
                        />
                      ) : <div className="h-32 flex items-center justify-center text-slate-400">CXR 載入失敗</div>}
                      <p className="text-[10px] text-slate-500 mt-2">判讀提示：無明顯肺淤血，可排除急性心衰竭。</p>
                    </div>
                  ) : (
                    <div className="h-40 bg-slate-50 border border-dashed border-slate-200 rounded flex flex-col items-center justify-center text-slate-400 text-[10px] italic">
                      <Lock className="w-6 h-6 mb-1 opacity-20" />
                      CXR 報告密封中。
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

              {/* BRASH Pathway - Examiner mode mostly */}
              {(isExaminerMode || visibility.isBrashRevealed) && (
                <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-100 rounded-2xl p-6 mt-6 shadow-sm">
                  <h4 className="font-sans font-extrabold text-teal-900 text-sm mb-4 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4" />
                    {scenario.topic.includes("BRASH") ? "BRASH Syndrome" : "臨床病理機制"}路徑 (Evaluation Logic)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    {clinicalLogic.pathway.map((p, idx) => (
                      <div key={idx} className="bg-white p-3 rounded-xl border border-teal-100 shadow-sm">
                        <div className="text-[9px] font-bold text-teal-600 uppercase">Step {p.step}</div>
                        <div className="text-[10px] font-bold text-slate-800 my-1">{p.title}</div>
                        <div className="text-[9px] text-slate-500 leading-tight">{p.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
        </>
      )}
    </div>
  );
}
