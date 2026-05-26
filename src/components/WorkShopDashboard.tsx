import { useState, useEffect } from "react";
import { TIMETABLE, CANDIDATES, INSTRUCTORS } from "../data/workshopData";
import { 
  Clock, Calendar, MapPin, Users, Award, Play, Pause, RotateCcw, 
  Map, Bell, Shield, Compass, BookOpen, ChevronRight, CheckSquare,
  Sparkles, Navigation, Eye, User, Search, Coffee, ArrowRight, HelpCircle,
  Maximize2, Minimize2, Volume2, VolumeX
} from "lucide-react";

interface WorkShopDashboardProps {
  onStartScoring?: (candidateId: string) => void;
}

export default function WorkShopDashboard({ onStartScoring }: WorkShopDashboardProps) {
  const [currentTime, setCurrentTime] = useState<string>("");
  const [selectedGroup, setSelectedGroup] = useState<string>("All");
  
  // Highlighting specific participant for the personal timeline generator
  const [selectedParticipant, setSelectedParticipant] = useState<string>("A1");
  // Highlight/simulation state of selected slot (active time block index, default to first real clinical slot index 1)
  const [currentSlotIdx, setCurrentSlotIdx] = useState<number>(1);

  // Simulated Countdown Timer (15 minutes mock interview loop)
  const [timeLeft, setTimeLeft] = useState<number>(900); // 15 mins
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [timerPreset, setTimerPreset] = useState<number>(900);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Synthesizer chime sound via Web Audio API (cross-platform, reliable offline/online)
  const playChimeSound = (type: "warning5" | "warning3" | "completed") => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = audioCtx.currentTime;

      const triggerChime = (time: number, freq: number, duration: number, volume = 0.3) => {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, time);
        gainNode.gain.setValueAtTime(volume, time);
        gainNode.gain.exponentialRampToValueAtTime(0.001, time + duration);
        osc.start(time);
        osc.stop(time + duration);
      };

      if (type === "warning5") {
        // Two crisp notification beats (5 minutes warning)
        triggerChime(now, 980, 0.15, 0.25);
        triggerChime(now + 0.2, 980, 0.15, 0.25);
      } else if (type === "warning3") {
        // Three progressive warning beats (3 minutes warning)
        triggerChime(now, 880, 0.2, 0.25);
        triggerChime(now + 0.25, 880, 0.2, 0.25);
        triggerChime(now + 0.5, 1100, 0.35, 0.3);
      } else if (type === "completed") {
        // Beautiful rich resonant double chime gong (Time complete)
        triggerChime(now, 523.25, 0.7, 0.4); // C5
        triggerChime(now + 0.1, 659.25, 0.7, 0.4); // E5
        triggerChime(now + 0.2, 783.99, 0.7, 0.4); // G5
        triggerChime(now + 0.3, 1046.50, 1.3, 0.5); // C6
        
        triggerChime(now + 0.8, 523.25, 0.7, 0.4);
        triggerChime(now + 0.9, 659.25, 0.7, 0.4);
        triggerChime(now + 1.0, 783.99, 0.7, 0.4);
        triggerChime(now + 1.1, 1046.50, 1.6, 0.5);
      }
    } catch (e) {
      console.warn("Audio context failed or not enabled yet", e);
    }
  };

  useEffect(() => {
    // Current timestamp display
    const timer = setInterval(() => {
      const TaipeiTime = new Date().toLocaleTimeString("zh-TW", {
        timeZone: "Asia/Taipei",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
      });
      setCurrentTime(TaipeiTime);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let timerId: any = null;
    if (isTimerRunning && timeLeft > 0) {
      timerId = setInterval(() => {
        setTimeLeft((prev) => {
          const next = prev - 1;
          if (next === 300) {
            playChimeSound("warning5");
          } else if (next === 180) {
            playChimeSound("warning3");
          } else if (next === 0) {
            playChimeSound("completed");
          }
          return next;
        });
      }, 1000);
    } else if (timeLeft === 0) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(timerId);
  }, [isTimerRunning, timeLeft, soundEnabled]);

  const toggleTimer = () => setIsTimerRunning(!isTimerRunning);
  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimeLeft(timerPreset);
  };

  const setPreset = (seconds: number) => {
    setIsTimerRunning(false);
    setTimerPreset(seconds);
    setTimeLeft(seconds);
  };

  const formatTimer = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Group filter logic (Roster List)
  const filteredCandidates = selectedGroup === "All" 
    ? CANDIDATES 
    : CANDIDATES.filter(c => c.group === selectedGroup);

  // Dynamic lookup for P2P and Tutor schedule allocations
  const getScheduleDetails = (slotIdx: number, pId: string) => {
    const id = pId.replace(/\s+/g, "").toUpperCase(); // e.g. "A1", "師1"
    
    if (slotIdx === 0) {
      return {
        room: "預備 & 報到諮商室",
        role: "報到",
        detail: "全體學員、考官報到",
        isBusy: true,
        roomType: "prep" as const,
        info: "臨床全體大會"
      };
    }
    
    if (slotIdx === 5) {
      return {
        room: "中場茶敘交流區",
        role: "中場休息",
        detail: "中場休息",
        isBusy: true,
        roomType: "break" as const,
        info: "中場休息"
      };
    }

    const isTutor = id.startsWith("師");

    // 1. If it's an Instructor (師1 ~ 師4)
    if (isTutor) {
      if (slotIdx === 1) {
        return {
          room: "主控台",
          role: "大會觀察督導",
          detail: "巡視考場並確認 Room 1 與 Room 2 之通訊連線",
          isBusy: false,
          roomType: "rest" as const,
          info: "大會督考"
        };
      }
      if (slotIdx === 2) {
        if (id === "師2") {
          return {
            room: "Room 2 兒科醫局試場",
            role: "考官",
            detail: "親自於 Room 2 評核 C1 (徐詠泰) 全程，並授予指導建議",
            isBusy: true,
            roomType: "room2" as const,
            info: "主考對象: C1"
          };
        }
      }
      if (slotIdx === 3) {
        if (id === "師4") {
          return {
            room: "Room 1 婦產科醫局試場",
            role: "考官",
            detail: "親自於 Room 1 評核 A1 (史育通) 全程並給予評級",
            isBusy: true,
            roomType: "room1" as const,
            info: "主考對象: A1"
          };
        }
        if (id === "師3") {
          return {
            room: "Room 1 婦產科醫局試場",
            role: "考官",
            detail: "親自於 Room 1 評核 B1 (永曜嘉) 全程並給予評級",
            isBusy: true,
            roomType: "room1" as const,
            info: "主考對象: B1"
          };
        }
        if (id === "師2") {
          return {
            room: "Room 2 兒科醫局試場",
            role: "考官",
            detail: "親自於 Room 2 評核 E1 (李紘名) 全程且提供改進引導",
            isBusy: true,
            roomType: "room2" as const,
            info: "主考對象: E1"
          };
        }
      }
      if (slotIdx === 4) {
        if (id === "師1") {
          return {
            room: "Room 2 兒科醫局試場",
            role: "考官",
            detail: "親自於 Room 2 評核 D1 (李宛蒨) 並進行臨床督導及評分",
            isBusy: true,
            roomType: "room2" as const,
            info: "主考對象: D1"
          };
        }
      }
      if (slotIdx === 6) {
        if (id === "師1") {
          return {
            room: "Room 2 兒科醫局試場",
            role: "考官",
            detail: "親自於 Room 2 評核 C2 (盧冠廷) 並指導雙向學習路徑",
            isBusy: true,
            roomType: "room2" as const,
            info: "主考對象: C2"
          };
        }
      }
      if (slotIdx === 7) {
        if (id === "師3") {
          return {
            room: "Room 1 婦產科醫局試場",
            role: "考官",
            detail: "親自於 Room 1 評核 A2 (陳仲昫) 並給出臨床回饋",
            isBusy: true,
            roomType: "room1" as const,
            info: "主考對象: A2"
          };
        }
        if (id === "師2") {
          return {
            room: "Room 1 婦產科醫局試場",
            role: "考官",
            detail: "親自於 Room 1 評核 B2 (陳泰源) 並給出臨床回饋",
            isBusy: true,
            roomType: "room1" as const,
            info: "主考對象: B2"
          };
        }
      }
      if (slotIdx === 8) {
        if (id === "師4") {
          return {
            room: "Room 2 兒科醫局試場",
            role: "考官",
            detail: "親自於 Room 2 評核 D2 (施柏鈞) 並簽核臨床學員評分",
            isBusy: true,
            roomType: "room2" as const,
            info: "主考對象: D2"
          };
        }
      }
      if (slotIdx === 9) {
        if (id === "師1") {
          return {
            room: "Room 2 兒科醫局試場",
            role: "考官",
            detail: "親自於 Room 2 評核 E2 (蔡仁傑) 並給予專業急診評估",
            isBusy: true,
            roomType: "room2" as const,
            info: "主考對象: E2"
          };
        }
      }

      return {
        room: "自主觀摩 / 主控休息",
        role: "大會觀察督導",
        detail: "可隨機前往 Room 1 & 2 了解其他分組演練或自主進行休息備課",
        isBusy: false,
        roomType: "rest" as const,
        info: "大會指導"
      };
    }

    // 2. If it's a Candidate (A1, A2, etc.)
    let group = "";
    let peer = "";
    let isSuffix1 = false;
    
    if (id === "A1" || id === "A2") { group = "A"; peer = id === "A1" ? "A2" : "A1"; isSuffix1 = id === "A1"; }
    else if (id === "B1" || id === "B2") { group = "B"; peer = id === "B1" ? "B2" : "B1"; isSuffix1 = id === "B1"; }
    else if (id === "C1" || id === "C2") { group = "C"; peer = id === "C1" ? "C2" : "C1"; isSuffix1 = id === "C1"; }
    else if (id === "D1" || id === "D2") { group = "D"; peer = id === "D1" ? "D2" : "D1"; isSuffix1 = id === "D1"; }
    else if (id === "E1" || id === "E2") { group = "E"; peer = id === "E1" ? "E2" : "E1"; isSuffix1 = id === "E1"; }

    const isRoom1 = group === "A" || group === "B";
    const roomName = isRoom1 ? "Room 1 婦產科醫局試場" : "Room 2 兒科醫局試場";
    const roomType = isRoom1 ? ("room1" as const) : ("room2" as const);

    // Is it an official exam slot for this group's candidate?
    let isOfficialExam = false;
    let instructorName = "";

    if (slotIdx === 2 && group === "C" && isSuffix1) { isOfficialExam = true; instructorName = "蘇培易"; }
    if (slotIdx === 3) {
      if (group === "A" && isSuffix1) { isOfficialExam = true; instructorName = "張昱"; }
      if (group === "B" && isSuffix1) { isOfficialExam = true; instructorName = "鍾睿元"; }
      if (group === "E" && isSuffix1) { isOfficialExam = true; instructorName = "蘇培易"; }
    }
    if (slotIdx === 4 && group === "D" && isSuffix1) { isOfficialExam = true; instructorName = "曾文斌"; }
    if (slotIdx === 6 && group === "C" && !isSuffix1) { isOfficialExam = true; instructorName = "曾文斌"; }
    if (slotIdx === 7) {
      if (group === "A" && !isSuffix1) { isOfficialExam = true; instructorName = "鍾睿元"; }
      if (group === "B" && !isSuffix1) { isOfficialExam = true; instructorName = "蘇培易"; }
    }
    if (slotIdx === 8 && group === "D" && !isSuffix1) { isOfficialExam = true; instructorName = "張昱"; }
    if (slotIdx === 9 && group === "E" && !isSuffix1) { isOfficialExam = true; instructorName = "曾文斌"; }

    const isPracticeSlot = (slotIdx === 1 || slotIdx === 3 || slotIdx === 6 || slotIdx === 8);
    const amIPracticing = isPracticeSlot ? isSuffix1 : !isSuffix1;

    if (isOfficialExam) {
      if (amIPracticing) {
        return {
          room: roomName,
          role: "受測者",
          detail: `接受指導老師模擬考試，進行臨床詢問與聽診等急診應對測驗`,
          isBusy: true,
          roomType,
          info: `考官: ${instructorName} / 觀摩者: ${peer}`
        };
      } else {
        return {
          room: roomName,
          role: "觀摩者",
          detail: `現場旁聽觀摩其搭檔施測，學習老師的臨床指導與建議`,
          isBusy: true,
          roomType,
          info: `受測者: ${peer} / 考官: ${instructorName}`
        };
      }
    }

    if (amIPracticing) {
      return {
        room: roomName,
        role: "受測者",
        detail: `擔任受測者，針對題目進行答題`,
        isBusy: true,
        roomType,
        info: `考官: ${peer}`
      };
    } else {
      return {
        room: roomName,
        role: "考官",
        detail: `擔任同儕考官，依評分表進行評分`,
        isBusy: true,
        roomType,
        info: `受測者: ${peer}`
      };
    }
  };

  // Chronological timeline journey calculation
  const getJourneyRoute = (targetId: string) => {
    if (!targetId) return [];
    
    return TIMETABLE.map((slot, idx) => {
      const details = getScheduleDetails(idx, targetId);
      return {
        idx,
        time: slot.time,
        location: details.room,
        detail: details.detail,
        isBusy: details.isBusy,
        roomType: details.roomType,
        matchedText: `${details.role}${details.info ? ` (${details.info})` : ""}`
      };
    });
  };

  // Render station blocks in cells, grouping candidates perfectly and making them clickable!
  const renderRoomStations = (slotIdx: number, isRoom1: boolean) => {
    if (slotIdx === 0) {
      return (
        <div className="flex items-center gap-2 p-1 py-1.5 text-slate-500 font-sans">
          <span className="w-2 h-2 rounded-full bg-slate-400 animate-pulse"></span>
          <span>報到</span>
        </div>
      );
    }
    if (slotIdx === 5) {
      return (
        <div className="flex items-center gap-2 p-1 py-1.5 text-emerald-800 font-sans font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>中場休息</span>
        </div>
      );
    }

    const stations = isRoom1 ? ["A", "B"] : ["C", "D", "E"];
    const gridColsClass = isRoom1 
      ? "grid grid-cols-1 sm:grid-cols-2 gap-2 py-1" 
      : "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2 py-1";

    return (
      <div className={gridColsClass}>
        {stations.map((group) => {
          const isPracticeOdd = (slotIdx === 1 || slotIdx === 3 || slotIdx === 6 || slotIdx === 8);
          const practiceId = `${group}${isPracticeOdd ? "1" : "2"}`;
          const examinerId = `${group}${isPracticeOdd ? "2" : "1"}`;

          // Master tutor mapping matching correct schedule times
          let leadTutor = "";
          if (slotIdx === 2 && group === "C") leadTutor = "師2";
          if (slotIdx === 3) {
            if (group === "A") leadTutor = "師4";
            if (group === "B") leadTutor = "師3";
            if (group === "E") leadTutor = "師2";
          }
          if (slotIdx === 4 && group === "D") leadTutor = "師1";
          if (slotIdx === 6 && group === "C") leadTutor = "師1";
          if (slotIdx === 7) {
            if (group === "A") leadTutor = "師3";
            if (group === "B") leadTutor = "師2";
          }
          if (slotIdx === 8 && group === "D") leadTutor = "師4";
          if (slotIdx === 9 && group === "E") leadTutor = "師1";

          const isPracticeHighlighted = selectedParticipant === practiceId;
          const isExaminerHighlighted = selectedParticipant === examinerId;
          const isTutorHighlighted = leadTutor && selectedParticipant === leadTutor;

          const practiceName = CANDIDATES.find(c => c.id === practiceId)?.name || practiceId;
          const examinerName = CANDIDATES.find(c => c.id === examinerId)?.name || examinerId;
          const tutorName = leadTutor ? INSTRUCTORS.find(ins => `師${ins.id}` === leadTutor)?.name : "";

          return (
            <div 
              key={group}
              className={`p-2 rounded-xl border text-left transition-all relative ${
                leadTutor 
                  ? "bg-rose-50/25 border-rose-200 ring-1 ring-rose-100/30" 
                  : "bg-[#FAF9F6]/40 border-[#E8E4D9] hover:bg-white"
              }`}
            >
              <div className="flex items-center justify-between border-b border-[#E8E4D9]/80 pb-1 mb-1">
                <span className="text-[10px] font-bold text-[#7A8B7E] font-serif uppercase tracking-wider block">
                  分站 {group}
                </span>
                {leadTutor && (
                  <span className="text-[8px] bg-rose-100 text-rose-800 px-1 py-0.2 rounded font-extrabold animate-pulse">
                    老師正式考
                  </span>
                )}
              </div>

              <div className="space-y-1 text-[11px] font-sans">
                {/* 1. Practice Candidate */}
                <div className="flex items-center justify-between gap-1 flex-wrap sm:flex-nowrap">
                  <span className="text-[10px] text-[#A8A297] shrink-0">受測者:</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedParticipant(practiceId);
                    }}
                    className={`px-1.5 py-0.5 text-[10px] font-mono font-bold rounded cursor-pointer transition-all truncate max-w-[130px] w-full text-center sm:text-left ${
                      group === "A" || group === "B" || group === "E"
                        ? "bg-amber-50 text-amber-800 border border-amber-200"
                        : "bg-teal-50 text-teal-800 border border-teal-200"
                    } ${isPracticeHighlighted ? "ring-2 ring-amber-500 scale-105 font-extrabold" : ""}`}
                    title={`1對1受測: ${practiceId} ${practiceName}`}
                  >
                    {practiceId} {practiceName}
                  </button>
                </div>

                {/* 2. Peer Examiner or Instructor / Observer layout depending on leadTutor */}
                {leadTutor ? (
                  <>
                    <div className="flex items-center justify-between gap-1 flex-wrap sm:flex-nowrap">
                      <span className="text-[10px] text-rose-700 font-bold shrink-0">考官:</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedParticipant(leadTutor);
                        }}
                        className={`px-1.5 py-0.5 text-[10px] bg-slate-800 text-white rounded font-bold cursor-pointer transition-all truncate max-w-[130px] w-full text-center sm:text-left ${
                          isTutorHighlighted ? "ring-2 ring-rose-500 scale-105" : ""
                        }`}
                        title={`考核指導導師: ${tutorName}`}
                      >
                        {leadTutor} {tutorName}
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-1 flex-wrap sm:flex-nowrap">
                      <span className="text-[10px] text-[#A8A297] shrink-0">觀摩者:</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedParticipant(examinerId);
                        }}
                        className={`px-1.5 py-0.5 text-[10px] font-mono font-bold rounded cursor-pointer transition-all truncate max-w-[130px] w-full text-center sm:text-left ${
                          group === "A" || group === "B" || group === "E"
                            ? "bg-teal-50/70 text-teal-800 border border-teal-150"
                            : "bg-amber-50/70 text-amber-800 border border-amber-150"
                        } ${isExaminerHighlighted ? "ring-2 ring-amber-500 scale-105 font-extrabold" : ""}`}
                        title={`臨床觀摩: ${examinerId} ${examinerName}`}
                      >
                        {examinerId} {examinerName}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-between gap-1 flex-wrap sm:flex-nowrap">
                    <span className="text-[10px] text-[#A8A297] shrink-0">考官:</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedParticipant(examinerId);
                      }}
                      className={`px-1.5 py-0.5 text-[10px] font-mono font-bold rounded cursor-pointer transition-all truncate max-w-[130px] w-full text-center sm:text-left ${
                        group === "A" || group === "B" || group === "E"
                          ? "bg-teal-50/70 text-teal-800 border border-teal-150"
                          : "bg-amber-50/70 text-amber-800 border border-amber-150"
                      } ${isExaminerHighlighted ? "ring-2 ring-amber-500 scale-105 font-extrabold" : ""}`}
                      title={`對等評分: ${examinerId} ${examinerName}`}
                    >
                      {examinerId} {examinerName}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const currentJourney = getJourneyRoute(selectedParticipant);
  const selectedParticipantName = 
    CANDIDATES.find(c => c.id === selectedParticipant)?.name || 
    INSTRUCTORS.find(i => `師${i.id}` === selectedParticipant.replace(/\s+/g, ""))?.name || 
    selectedParticipant;

  return (
    <div className="space-y-6" id="workshop-dashboard-container">
      {/* Banner & Information */}
      <div className="bg-[#EBF1EA] border border-[#DDD9CD] text-[#3D3833] rounded-2xl p-6 shadow-xs relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-15 pointer-events-none">
          <svg className="w-full h-full text-[#7A8B7E]" viewBox="0 0 100 100" fill="currentColor">
            <path d="M0 100 L100 0 L100 100 Z" />
          </svg>
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 bg-white px-3 py-1 rounded-full border border-[#DDD9CD] text-[#7A8B7E] font-medium text-xs">
              <Calendar className="w-3.5 h-3.5" />
              台北國泰醫院 ＆ 臺大醫院急診教學小組聯合主辦
            </div>
            <h2 className="text-xl sm:text-2xl font-serif text-[#3D3833] font-bold tracking-tight">
              2026住院醫師聯合面試訓練
            </h2>
            <p className="text-xs text-[#5C5650] max-w-2xl leading-relaxed">
              依據時間到 Room 1、Room 2 進行面試練習。
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#DDD9CD] text-center shrink-0 min-w-[200px] shadow-xs">
            <span className="text-[10px] text-[#A8A297] uppercase tracking-widest block font-mono">Taipei Current Time</span>
            <span className="text-xl font-bold font-mono text-[#4B5A4E] tracking-wider block mt-1">
              {currentTime || "09:00:00"}
            </span>
            <div className="mt-2 text-[10px] bg-[#E2E8E3] text-[#4B5A4E] px-2 py-0.5 rounded-full inline-block font-sans">
              2026 / 05 / 20 (三)
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic 1-to-1 Peer Evaluation Guideline Info Card */}
      <div className="bg-white border border-[#E8E4D9] rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#E8E4D9]/80 pb-2.5 gap-2">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-4 bg-amber-500 rounded-full"></div>
            <h3 className="text-sm font-bold font-serif text-[#3D3833]">
              1對1 雙向互評對照機制說明 (1-to-1 Peer-Evaluation Rule)
            </h3>
          </div>
          <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full font-bold self-start sm:self-auto">
            對等互評制度
          </span>
        </div>

        <p className="text-xs text-[#5C5650] leading-relaxed font-sans">
          本場工作坊採雙向相互對評制度：當 <strong>考生（如 A1）練習</strong>時，另一考生即擔任 <strong>考官（如 A2）</strong>為其填表評分；反之亦然。大會指定時段將由 <strong>老師進行模擬考試</strong>，其組別對照如下：
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-1.5">
          {[
            { group: "A", p1: "A1 史育通 (國泰)", p2: "A2 陳仲昫 (台大)" },
            { group: "B", p1: "B1 永曜嘉 (國泰)", p2: "B2 陳泰源 (台大)" },
            { group: "C", p1: "C1 徐詠泰 (國泰)", p2: "C2 盧冠廷 (台大)" },
            { group: "D", p1: "D1 李宛蒨 (國泰)", p2: "D2 施柏鈞 (台大)" },
            { group: "E", p1: "E1 李紘名 (馬偕)", p2: "E2 蔡仁傑 (台大)" },
          ].map((pair) => {
            const isPairActive = selectedParticipant.startsWith(pair.group);

            return (
              <div 
                key={pair.group}
                onClick={() => setSelectedParticipant(`${pair.group}1`)}
                className={`p-3 rounded-xl border transition-all cursor-pointer text-center space-y-2 relative ${
                  isPairActive 
                    ? "bg-amber-50/40 border-amber-300 shadow-xs ring-1 ring-amber-200 scale-102" 
                    : "bg-[#FAF9F6]/50 border-[#E8E4D9] hover:border-[#DDD9CD] hover:bg-white"
                }`}
              >
                <div className="text-[10px] font-extrabold text-[#7A8B7E] font-serif tracking-widest uppercase">
                  第 {pair.group} 組相互對評
                </div>
                <div className="space-y-1 text-xs">
                  <div className="font-semibold text-slate-850 transition-colors">
                    {pair.p1}
                  </div>
                  <div className="text-[10px] text-slate-400 font-bold">⇅ 互相評分 ⇅</div>
                  <div className="font-semibold text-slate-850 transition-colors">
                    {pair.p2}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Columns: Timetable Detail & Interactive Route Map */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Main Integrated Timetable Card */}
          <div className="bg-white border border-[#E8E4D9] rounded-2xl shadow-xs overflow-hidden">
            <div className="border-b border-[#E8E4D9] px-6 py-4 bg-[#FAF9F6] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-serif font-bold text-[#3D3833] text-sm flex items-center gap-2">
                  <Compass className="w-4.5 h-4.5 text-[#7A8B7E]" />
                  工作坊大時程與試場穿梭對照表 (Digitized Master Table)
                </h3>
                <p className="text-[11px] text-[#8E877C] mt-0.5">
                  💡 立即啟用個人流程
                </p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setSelectedParticipant("A1")}
                  className="px-2.5 py-1 text-xs bg-white text-[#7A8B7E] border border-[#DDD9CD] rounded-md hover:bg-[#FAF9F6] transition"
                >
                  重設為 A1
                </button>
                <span className="text-xs bg-[#E2E8E3] text-[#4B5A4E] px-3 py-1 rounded-md font-bold font-sans">
                  共 10 個時段
                </span>
              </div>
            </div>

            <div className="p-4 overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1050px]">
                <thead>
                  <tr className="border-b border-[#E8E4D9] text-[10px] uppercase font-bold text-[#A8A297] bg-[#FAF9F6]">
                    <th className="py-2.5 px-3 w-[70px]">時程階段</th>
                    <th className="py-2.5 px-3 w-[100px]">時間段</th>
                    <th className="py-2.5 px-3 border-l border-[#E8E4D9] w-[38%] min-w-[340px]">
                      <span className="flex items-center gap-1.5 font-semibold text-[#4A443F]">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                        🚪 Room 1 婦產科醫局試場
                      </span>
                    </th>
                    <th className="py-2.5 px-3 border-l border-[#E8E4D9] w-[48%] min-w-[460px]">
                      <span className="flex items-center gap-1.5 font-semibold text-[#4A443F]">
                        <span className="w-2.5 h-2.5 rounded-full bg-teal-500 inline-block"></span>
                        🚪 Room 2 兒科醫局試場
                      </span>
                    </th>
                    <th className="py-2.5 px-2 text-center w-[100px]">設定狀態</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E4D9] text-xs">
                  {TIMETABLE.map((row, idx) => {
                    const isPrepOrBreak = row.type === "prep" || row.type === "break";
                    const isCurrent = idx === currentSlotIdx;
                    
                    // Grouping variables mirroring physical print layouts
                    let groupCell = null;
                    if (idx === 0) {
                      groupCell = (
                        <td rowSpan={1} className="py-3 px-3 w-[70px] bg-[#FAF9F6] text-center font-bold text-[#7A8B7E] border-r border-[#E8E4D9] text-[10px] tracking-wider font-sans">
                          預備
                        </td>
                      );
                    } else if (idx === 1) {
                      groupCell = (
                        <td rowSpan={4} className="py-3 px-3 w-[70px] bg-[#FAF9F6] text-center font-bold text-[#4B5A4E] border-r border-[#E8E4D9] text-[10px] tracking-wider font-sans">
                          上半場
                        </td>
                      );
                    } else if (idx === 5) {
                      groupCell = (
                        <td rowSpan={1} className="py-3 px-3 w-[70px] bg-[#F2F0EB] text-center font-bold text-[#736750] border-r border-[#E8E4D9] text-[10px] tracking-wider font-sans">
                          休息
                        </td>
                      );
                    } else if (idx === 6) {
                      groupCell = (
                        <td rowSpan={4} className="py-3 px-3 w-[70px] bg-[#FAF9F6] text-center font-bold text-[#8E877C] border-r border-[#E8E4D9] text-[10px] tracking-wider font-sans">
                          下半場
                        </td>
                      );
                    }

                    // Checks if selected participant has active task in this row
                    const details = getScheduleDetails(idx, selectedParticipant);
                    const isParticipantHere = details.isBusy;

                    return (
                      <tr 
                        key={idx} 
                        onClick={() => setCurrentSlotIdx(idx)}
                        className={`transition-colors cursor-pointer group/row ${
                          isCurrent 
                            ? "bg-[#EBF1EA]/50 font-medium border-l-4 border-l-[#7A8B7E]" 
                            : isParticipantHere 
                              ? "bg-amber-50/20 hover:bg-[#FAF9F6]" 
                              : "hover:bg-[#FAF9F6]"
                        }`}
                      >
                        {groupCell}
                        <td className="py-3 px-3 text-[#5C5650] font-mono font-medium whitespace-nowrap">
                          {row.time}
                        </td>
                        
                        {/* Room 1 */}
                        <td className="py-3 px-3 border-l border-[#E8E4D9]">
                          {renderRoomStations(idx, true)}
                        </td>

                        {/* Room 2 */}
                        <td className="py-3 px-3 border-l border-[#E8E4D9]">
                          {renderRoomStations(idx, false)}
                        </td>

                        {/* Quick controls cell */}
                        <td className="py-3 px-2 text-center whitespace-nowrap">
                          <button
                            title="設定本時段為當前進行段"
                            className={`px-2 py-0.5 rounded text-[10px] font-sans ${
                              isCurrent
                                ? "bg-[#7A8B7E] text-white font-bold"
                                : "bg-[#F2F0EB] text-[#5C5650] hover:bg-[#E8E4D9]"
                            }`}
                          >
                            {isCurrent ? "進行中" : "切換"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Dynamic Personalized Journey Blueprint panel */}
          {selectedParticipant && (
            <div className="bg-white border-2 border-[#7A8B7E]/60 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#E8E4D9] pb-4 gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-[#7A8B7E] rounded-full flex items-center justify-center text-white font-serif font-extrabold shadow-sm">
                    {selectedParticipant}
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-[#3D3833] text-base">
                      {selectedParticipantName}
                    </h4>
                  </div>
                </div>

                {/* Compatibility handler block with optional scoring trigger */}
                {onStartScoring && !selectedParticipant.startsWith("師") && (
                  <button
                    onClick={() => onStartScoring(selectedParticipant)}
                    className="self-start sm:self-center inline-flex items-center gap-1.5 px-4 py-2 bg-[#7A8B7E] text-white text-xs font-bold rounded-full hover:bg-[#6A7C6E] transition shadow-md shadow-[#7A8B7E]/20"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    立即評分該位考生
                  </button>
                )}
              </div>

              {/* Graphical Timeline Stream */}
              <div className="relative border-l border-[#DDD9CD] ml-4 pl-6 space-y-5 py-2">
                {currentJourney.map((journey, index) => {
                  const isSlotCurrent = journey.idx === currentSlotIdx;
                  let dotColor = "bg-[#DDD9CD] border-[#FAF9F6]";
                  let itemBorderColor = "border-[#E8E4D9]";
                  let itemBg = "bg-[#FAF9F6]/50";
                  
                  if (journey.roomType === "prep" || journey.roomType === "break") {
                    dotColor = "bg-[#8E877C] border-white";
                    itemBg = "bg-[#F2F0EB]/50";
                  } else if (journey.isBusy) {
                    dotColor = journey.roomType === "room1" 
                      ? "bg-amber-600 border-amber-200"
                      : "bg-teal-600 border-teal-200";
                    itemBorderColor = "border-amber-200";
                    itemBg = "bg-amber-50/10";
                  }

                  if (isSlotCurrent) {
                    dotColor = "bg-rose-600 border-rose-200 ring-2 ring-rose-100 scale-125";
                    itemBorderColor = "border-rose-300 ring-1 ring-rose-50";
                    itemBg = "bg-rose-50/20";
                  }

                  return (
                    <div key={index} className="relative group">
                      {/* Timeline Node Badge */}
                      <span className={`absolute -left-[30px] top-1.5 w-4 h-4 rounded-full border-2 transition-all ${dotColor}`}></span>
                      
                      <div className={`p-3 rounded-xl border ${itemBorderColor} ${itemBg} transition-all`}>
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1">
                          <span className="text-xs font-mono font-bold text-[#4A443F] flex items-center gap-1.5">
                            {journey.time}
                            {isSlotCurrent && (
                              <span className="inline-flex items-center px-1.5 py-0.2 bg-rose-100 text-rose-700 text-[9px] font-bold rounded">
                                📍 正在進行時段
                              </span>
                            )}
                          </span>
                          
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            journey.roomType === "room1" 
                              ? "bg-amber-100 text-amber-900"
                              : journey.roomType === "room2"
                                ? "bg-teal-100 text-teal-900"
                                : "bg-slate-150 text-slate-700"
                          }`}>
                            {journey.location}
                          </span>
                        </div>

                        <div className="mt-2 flex items-start gap-2 justify-between">
                          <div className="space-y-1">
                            {/* Original cell string */}
                            <p className="text-xs text-[#3D3833] font-medium leading-relaxed">
                              {journey.detail}
                            </p>
                            
                            {/* Role Tag description */}
                            {journey.matchedText && (
                              <p className="text-[10px] text-[#7A8B7E] font-medium flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-amber-500 inline-block"></span>
                                {journey.matchedText.includes("報到") 
                                  ? "報到" 
                                  : journey.matchedText.includes("中場休息") 
                                    ? "中場休息" 
                                    : `肩負角色分配：${journey.matchedText}`}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Rulebook instructions */}
          <div className="bg-white border border-[#E8E4D9] rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="font-serif font-bold text-[#3D3833] text-sm flex items-center gap-2 border-b border-[#E8E4D9] pb-3">
              <BookOpen className="w-4 h-4 text-[#7A8B7E]" />
              工作坊練習流程與試場穿梭導引規章
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-sans">
              <div className="p-4 bg-[#FAF9F6] rounded-xl border border-[#E8E4D9] space-y-2">
                <div className="w-6 h-6 rounded-full bg-[#E2E8E3] text-[#4B5A4E] flex items-center justify-center font-bold">
                  1
                </div>
                <h4 className="font-bold text-[#3D3833]">1. 自備與同儕演練</h4>
                <p className="text-[#5C5650] leading-relaxed text-[11px]">
                  每位學生須自備 3 道急診臨床考題，並依照分組表與同儕互成考官與考生，完成自評及修正。
                </p>
              </div>

              <div className="p-4 bg-[#FAF9F6] rounded-xl border border-[#E8E4D9] space-y-2">
                <div className="w-6 h-6 rounded-full bg-[#F0EEE9] text-[#736750] flex items-center justify-center font-bold">
                  2
                </div>
                <h4 className="font-bold text-[#3D3833]">2. 臨床導師實地正式考</h4>
                <p className="text-[#5C5650] leading-relaxed text-[11px]">
                  指定考核時段，台大及國泰之醫學部指導導師將入駐考場，提供 1 對 1 即時簽核與回饋。
                </p>
              </div>

              <div className="p-4 bg-[#FAF9F6] rounded-xl border border-[#E8E4D9] space-y-2">
                <div className="w-6 h-6 rounded-full bg-[#E2E8E3] text-[#7A8B7E] flex items-center justify-center font-bold">
                  3
                </div>
                <h4 className="font-bold text-[#3D3833]">3. 嚴格 15 分鐘答題</h4>
                <p className="text-[#5C5650] leading-relaxed text-[11px]">
                  答題設有嚴格 15 分鐘上限，5 分鐘與 3 分鐘設有音效警示，隨後由考核教師進行診斷講評。
                </p>
              </div>
            </div>

            {/* Simulated classroom location details */}
            <div className="bg-[#3D3833] text-[#FAF9F6] p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center gap-4 border border-[#2C2622]">
              <div className="p-2 bg-[#4A443F] rounded-lg text-[#E2E8E3]">
                <MapPin className="w-5 h-5 animate-bounce" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-[#A8A297] font-mono block">LIVE LOCATION</span>
                <span className="font-bold text-white text-xs">台北國泰綜合醫院 33 會議室 (國泰人壽大樓 B1)</span>
                <p className="text-[10px] text-[#A8A297]">
                  台北市大安區仁愛路四段266號。可搭乘捷運至「忠孝敦化站」往南步行 6 分鐘。
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Columns: Countdown clock & Roster Grid */}
        <div className="space-y-6">
          
          {/* Countdown Clock Panel (Fits "場內設有倒數計時器" criteria) */}
          <div className="bg-white border border-[#E8E4D9] rounded-2xl shadow-xs p-6 text-center space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8E4D9] pb-3">
              <h4 className="font-serif font-bold text-[#3D3833] text-xs text-left flex items-center gap-1.5 uppercase tracking-wider">
                <Bell className="w-4 h-4 text-rose-500 animate-swing shrink-0" />
                考場答題倒數計時器 (Room Clock)
              </h4>
              <div className="flex items-center gap-1.5">
                {/* Sound control toggle */}
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                    soundEnabled 
                      ? "text-teal-700 bg-teal-50 border-teal-200 hover:bg-teal-100" 
                      : "text-slate-400 bg-slate-50 border-slate-200 hover:bg-slate-100"
                  }`}
                  title={soundEnabled ? "點擊關閉提示音" : "點擊開啟提示音"}
                >
                  {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                </button>
                {/* Fullscreen maximize button */}
                <button
                  onClick={() => setIsFullscreen(true)}
                  className="p-1.5 rounded-lg border text-[#4A443F] bg-[#F2F0EB] border-[#E8E4D9] hover:bg-[#E8E4D9] transition-all flex items-center gap-1 text-[10px] font-bold cursor-pointer"
                  title="放大全螢幕展示"
                >
                  <Maximize2 className="w-3 h-3" />
                  <span>放大</span>
                </button>
              </div>
            </div>
            
            <div className="bg-[#221D1A] px-6 py-8 rounded-2xl border-2 border-[#14110E] shadow-inner relative overflow-hidden">
              <div className="absolute top-2 left-2 bg-[#14110E] border border-slate-800 text-[10px] font-mono text-[#A8A297] px-1.5 py-0.5 rounded uppercase">
                Mock Exam Timer
              </div>
              <span className={`text-[46px] font-mono leading-none tracking-widest block font-bold cursor-pointer ${
                timeLeft < 180 ? "text-rose-500 animate-pulse" : "text-amber-400"
              }`} onClick={() => setIsFullscreen(true)}>
                {formatTimer(timeLeft)}
              </span>
              <div className="mt-2 text-[10px] text-slate-400 flex justify-center items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#7A8B7E]"></span>
                  限時 15:00
                </span>
                <span className="text-[#A8A297]">•</span>
                <button 
                  onClick={() => playChimeSound("completed")}
                  className="text-amber-400 hover:text-amber-500 active:scale-95 transition-all text-[10px] font-bold underline cursor-pointer"
                  title="測試內置大會完試鈴聲"
                >
                  🔔 測試鈴聲
                </button>
                {timeLeft < 180 && (
                  <span className="text-rose-400 font-bold ml-1">
                    ⚠️ 剩餘不到三分！
                  </span>
                )}
              </div>
            </div>

            {/* Simulation controls */}
            <div className="grid grid-cols-3 gap-2">
              <button
                id="timer-toggle-btn"
                onClick={toggleTimer}
                className={`py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all text-white cursor-pointer ${
                  isTimerRunning ? "bg-rose-700 hover:bg-rose-800" : "bg-teal-700 hover:bg-teal-800"
                }`}
              >
                {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                {isTimerRunning ? "暫停" : "開始"}
              </button>
              <button
                id="timer-reset-btn"
                onClick={resetTimer}
                className="py-2 px-3 text-xs font-semibold rounded-lg bg-[#F2F0EB] text-[#4A443F] hover:bg-[#E8E4D9] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                重設
              </button>
              <div className="relative">
                <select
                  onChange={(e) => setPreset(parseInt(e.target.value))}
                  value={timerPreset}
                  className="w-full py-2 px-1 text-xs font-semibold rounded-lg bg-[#F2F0EB] text-[#4A443F] border-none hover:bg-[#E8E4D9] cursor-pointer text-center"
                >
                  <option value={900}>15 分鐘</option>
                  <option value={600}>10 分鐘</option>
                  <option value={300}>5 分鐘</option>
                  <option value={60}>1 分鐘</option>
                </select>
              </div>
            </div>
          </div>
 
          {/* Rosters / Groups List */}
          <div className="bg-white border border-[#E8E4D9] rounded-2xl shadow-xs overflow-hidden">
            <div className="border-b border-[#E8E4D9] px-5 py-4 bg-[#FAF9F6] flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <h4 className="font-serif font-bold text-[#3D3833] text-sm flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[#7A8B7E]" />
                  分組考生名冊 (Workshop Roster)
                </h4>
                <div className="flex gap-1">
                  {["All", "A", "B", "C", "D", "E"].map((g) => (
                    <button
                      key={g}
                      onClick={() => setSelectedGroup(g)}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded transition-all ${
                        selectedGroup === g ? "bg-[#7A8B7E] text-white" : "text-[#5C5650] hover:bg-[#F2F0EB]"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-[10px] text-[#8E877C]">
                🎯 點擊任一考生名單，自動锁定為排班與穿梭軌跡之「當前追蹤對象」
              </p>
            </div>

            <div className="p-4 space-y-2 max-h-[300px] overflow-y-auto">
              {filteredCandidates.map((cCandidate) => {
                const isCurrentActive = selectedParticipant === cCandidate.id;
                
                return (
                  <button
                    key={cCandidate.id}
                    onClick={() => setSelectedParticipant(cCandidate.id)}
                    className={`w-full text-left p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                      isCurrentActive 
                        ? "border-[#7A8B7E] bg-[#EBF1EA]/40 ring-1 ring-[#7A8B7E]" 
                        : "border-[#E8E4D9] bg-[#FAF9F6]/50 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-md font-mono text-[10px] font-bold flex items-center justify-center border ${
                        cCandidate.id.endsWith("2")
                          ? "bg-teal-50 text-teal-800 border-teal-150"
                          : "bg-amber-50 text-amber-800 border-amber-150"
                      }`}>
                        {cCandidate.id}
                      </span>
                      <div>
                        <span className="font-bold text-[#3D3833] text-xs">{cCandidate.name}</span>
                        <span className="text-[10px] text-[#8E877C] ml-1.5">({cCandidate.hospital}急診部)</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono font-bold text-[#8E877C] bg-white border border-[#E8E4D9] px-2 py-0.5 rounded-full">
                        組: {cCandidate.group}
                      </span>
                      {isCurrentActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block animate-ping"></span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Instructor Guide Panel */}
          <div className="bg-white border border-[#E8E4D9] rounded-2xl shadow-xs p-5 space-y-4">
            <div>
              <h4 className="font-serif font-bold text-[#3D3833] text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4 text-[#7A8B7E]" />
                急診醫學臨床考核導師陣容 (Tutors)
              </h4>
              <p className="text-[9px] text-[#8E877C] mt-0.5">
                點擊老師卡片，即可鎖定考官之試場督導或評核行程
              </p>
            </div>
            <div className="space-y-3">
              {INSTRUCTORS.map((instructor) => {
                const searchCode = `師${instructor.id}`;
                const isCurrentActive = selectedParticipant === searchCode;

                return (
                  <button
                    key={instructor.id}
                    onClick={() => setSelectedParticipant(searchCode)}
                    className={`w-full text-left p-3 border rounded-xl flex items-start gap-2.5 transition-all text-xs ${
                      isCurrentActive 
                        ? "border-[#7A8B7E] bg-[#EBF1EA]/40 ring-1 ring-[#7A8B7E]" 
                        : "border-[#E8E4D9] bg-[#FAF9F6]/50 hover:bg-white"
                    }`}
                  >
                    <span className="w-6 h-6 rounded-full bg-[#E2E8E3] border border-[#DDD9CD] text-[#7A8B7E] text-[10px] font-bold flex items-center justify-center shrink-0">
                      師{instructor.id}
                    </span>
                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#3D3833]">{instructor.name} 醫師</span>
                        {isCurrentActive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block"></span>
                        )}
                      </div>
                      <span className="text-[10px] text-[#5C5650] block leading-tight">{instructor.hospital}</span>
                      <span className="text-[9px] text-[#8E877C] block font-light">{instructor.title}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Overlay Timer Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-[#090807] text-white flex flex-col justify-between p-6 sm:p-12 md:p-16 select-none animate-fade-in font-sans">
          {/* Top Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-800 pb-5 gap-4">
            <div className="flex items-center gap-3">
              <Bell className="w-6 h-6 text-amber-500 animate-swing shrink-0" />
              <div>
                <h2 className="text-lg md:text-xl font-serif font-bold text-zinc-100 tracking-wide">
                  2026住院醫師聯合面試訓練 — 考場計時監控
                </h2>
                <p className="text-xs text-zinc-400">
                  Room Clock Broadcast • 內置自動/手動提示鈴聲
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto">
              <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-full px-4 py-1.5 text-xs text-zinc-400 font-mono">
                <span className={`w-2 h-2 rounded-full ${isTimerRunning ? "bg-emerald-500 animate-ping" : "bg-rose-500"}`}></span>
                {isTimerRunning ? "ACTIVE" : "STANDBY"}
              </div>
              
              {/* Voice bell mute switch */}
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                  soundEnabled 
                    ? "text-teal-400 bg-teal-950/40 border-teal-800 hover:bg-teal-900/40" 
                    : "text-zinc-500 bg-zinc-900/40 border-zinc-800 hover:bg-zinc-800"
                }`}
                title={soundEnabled ? "關閉提示鈴聲" : "開啟提示鈴聲"}
              >
                {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
              
              {/* Minimize screen toggle */}
              <button
                onClick={() => setIsFullscreen(false)}
                className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer shadow-lg"
              >
                <Minimize2 className="w-4 h-4" />
                <span>結束全螢幕</span>
              </button>
            </div>
          </div>

          {/* Large Digital Face */}
          <div className="flex-1 flex flex-col justify-center items-center py-6">
            <div className="relative flex flex-col items-center justify-center w-full max-w-4xl">
              <div className="text-[22vw] sm:text-[18vw] md:text-[20vw] font-mono leading-none tracking-widest font-extrabold text-center select-none font-bold">
                <span className={timeLeft < 180 ? "text-rose-500 font-bold animate-pulse" : "text-amber-400"}>
                  {formatTimer(timeLeft)}
                </span>
              </div>
              
              <div className="mt-4 flex items-center gap-4 text-xs md:text-sm text-zinc-400 font-medium bg-zinc-950/60 px-4 py-2 rounded-full border border-zinc-900">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                  限時: 15分鐘
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5 text-rose-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  3分鐘、5分鐘語音音效警示
                </span>
                <span>•</span>
                <button 
                  onClick={() => playChimeSound("completed")} 
                  className="text-amber-400 hover:underline flex items-center gap-1 ml-1 font-bold cursor-pointer"
                >
                  🔔 手動測試完試大鈴聲
                </button>
              </div>
              
              {timeLeft === 0 && (
                <div className="absolute inset-x-0 -inset-y-4 flex items-center justify-center bg-[#090807]/95 rounded-3xl border-2 border-rose-500 flex-col space-y-4 animate-fade-in p-6 text-center z-10 shadow-2xl">
                  <span className="text-rose-500 text-4xl sm:text-6xl font-extrabold tracking-widest animate-bounce">
                    時間到 TIME OUT!
                  </span>
                  <p className="text-zinc-300 text-sm sm:text-base max-w-md font-sans">
                    15分鐘答題上限已到。請考核教師即將開始進行個別診斷、講評與回饋建議。
                  </p>
                  <button
                    onClick={resetTimer}
                    className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-all text-xs cursor-pointer shadow-md"
                  >
                    重設計時
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Settings controls and Local indicators */}
          <div className="border-t border-zinc-900 pt-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-xs text-zinc-500 uppercase tracking-wider font-bold">快速預設限時:</span>
              {[900, 600, 300, 60].map((presetSeconds) => (
                <button
                  key={presetSeconds}
                  onClick={() => setPreset(presetSeconds)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    timerPreset === presetSeconds
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/50"
                      : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-900"
                  }`}
                >
                  {presetSeconds / 60} 分鐘
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={toggleTimer}
                className={`px-8 py-3.5 rounded-xl text-sm font-extrabold flex items-center gap-2 transition-all text-white cursor-pointer shadow-lg hover:brightness-110 active:scale-95 ${
                  isTimerRunning ? "bg-rose-600" : "bg-teal-600"
                }`}
              >
                {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isTimerRunning ? "暫停計時" : "開始計時"}</span>
              </button>
              <button
                onClick={resetTimer}
                className="px-5 py-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all font-bold flex items-center gap-1.5 text-xs cursor-pointer shadow"
              >
                <RotateCcw className="w-4 h-4" />
                <span>重設時間</span>
              </button>
            </div>

            <div className="text-right flex flex-col">
              <span className="text-[9px] text-zinc-500 uppercase font-mono tracking-wider">Taipei local Time</span>
              <span className="text-sm font-mono text-zinc-300 font-semibold">{currentTime}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
