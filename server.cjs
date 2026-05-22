var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
import_dotenv.default.config();
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json());
var SCORES_FILE = import_path.default.join(process.cwd(), "scores-db.json");
function readScoresFromFile() {
  try {
    if (import_fs.default.existsSync(SCORES_FILE)) {
      const data = import_fs.default.readFileSync(SCORES_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading scores file, defaulting to empty:", err);
  }
  return [];
}
function writeScoresToFile(scores) {
  try {
    import_fs.default.writeFileSync(SCORES_FILE, JSON.stringify(scores, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing scores file:", err);
  }
}
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
      (s) => s.candidateId === newScore.candidateId && s.evaluatorId === newScore.evaluatorId && (s.caseIdx === newScore.caseIdx || !s.caseIdx && !newScore.caseIdx)
    );
    if (existingIdx >= 0) {
      scores[existingIdx] = newScore;
    } else {
      scores.push(newScore);
    }
    writeScoresToFile(scores);
    res.json({ success: true, scores });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
var scenarioVisibility = {
  isHistoryRevealed: false,
  isLabsRevealed: false,
  isCxrRevealed: false,
  isBrashRevealed: false,
  isEcgRevealed: false
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
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.post("/api/scores/clear", (req, res) => {
  try {
    writeScoresToFile([]);
    res.json({ success: true, scores: [] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
var generativeAiClient = null;
function getGeminiClient() {
  if (!generativeAiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is not configured. Clean feedback can still be graded locally without API calling.");
    }
    generativeAiClient = new import_genai.GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return generativeAiClient;
}
app.post("/api/evaluations/ai-feedback", async (req, res) => {
  try {
    const {
      candidateName,
      hospital,
      checklistState,
      overallPercentage,
      examinerNotes
    } = req.body;
    const fallbackResponse = `[\u6A21\u64EC\u8A55\u9451\u56DE\u994B] ${candidateName} \u91AB\u5E2B\u65BC\u672C\u6B21\u6025\u6027 BRASH Syndrome \u6848\u4F8B\u6A21\u64EC\u4E2D\u5B8C\u6210\u8A55\u5206\uFF0C\u52A0\u6B0A\u8A55\u5206\u7D04\u70BA ${overallPercentage}%\u3002\u8ACB\u4F9D\u64DA\u4E0B\u65B9\u8907\u9078\u6838\u5C0D\u6E05\u55AE\u8207\u5C0E\u5E2B\u5EFA\u8B70\u9032\u884C\u81E8\u5E8A\u53CD\u601D\u8207\u6539\u9032\u3002`;
    let client;
    try {
      client = getGeminiClient();
    } catch (err) {
      return res.json({
        success: true,
        feedback: `${fallbackResponse}

\u26A0\uFE0F \u7CFB\u7D71\u63D0\u793A\uFF1A\u4F3A\u670D\u5668\u672A\u6AA2\u6E2C\u5230 GEMINI_API_KEY\u3002\u6B64\u70BA\u7CFB\u7D71\u5728\u7F3A\u4E4F\u91D1\u9470\u6642\u6240\u4EE3\u767C\u4E4B\u6A19\u6E96\u56DE\u994B\uFF1A
1. \u75C5\u53F2\uFF1A\u5DF2\u521D\u6B65\u4E86\u89E3\u75C5\u60A3\u591A\u91CD\u7528\u85E5\uFF08AV \u963B\u6EEF\u5291\u8207\u5229\u5C3F\u5291\uFF09\u4E4B\u95DC\u9375\uFF0C\u4F46\u9700\u66F4\u91CD\u8996\u8207\u5BB6\u5C6C\u7684\u6CBB\u7642\u8655\u7F6E\u5C0D\u8AC7\u3002
2. \u8EAB\u9AD4\u6AA2\u67E5\uFF1A\u80FD\u78BA\u5BE6\u6838\u67E5\u812B\u6C34\u3001\u9ECF\u819C\u504F\u4E7E\u53CA\u5FAE\u8840\u7BA1\u5145\u76C8\uFF08CRT\uFF09\uFF0C\u4E0B\u4E00\u6B65\u61C9\u4E3B\u52D5\u806F\u7D61\u5F8C\u7DDA\u79D1\u5225\u7167\u6703\u3002
3. \u6A5F\u68B0\u6027\u80CC\u8AA6\u5E38\u898F\u964D\u9240\uFF0C\u5728\u5408\u4F75\u5FC3\u640F\u904E\u6162\u6642\uFF0C\u61C9\u512A\u5148\u8003\u91CF\u975C\u8108 Calcium \u4FDD\u8B77\u5FC3\u808C\u4EE5\u514D\u60E1\u5316\u3002`
      });
    }
    const systemInstruction = `\u4F60\u662F\u4E00\u4F4D\u53F0\u7063\u6025\u8A3A\u91AB\u5B78\u90E8\u6559\u5B78\u8A08\u5283\u4E3B\u6301\u4EBA(Teaching Program Director)\u3002
\u5C08\u9580\u7528\u4F86\u8A55\u9451\u4F4F\u9662\u91AB\u5E2B\uFF08\u6216\u7533\u8ACB\u5165\u8077\u4E4B\u91AB\u5E2B\uFF09\u5728\u81E8\u5E8A\u9762\u8A66\u6A21\u64EC\u60C5\u5883\u4E2D\u7684\u8868\u73FE\uFF0C\u4E26\u64B0\u5BEB\u5BA2\u89C0\u3001\u5EFA\u8A2D\u6027\u7684\u7E41\u9AD4\u4E2D\u6587\u300C\u81E8\u5E8A\u57F9\u80B2\u5C0E\u5E2B\u8A55\u8A9E(Feedback Report)\u300D\u3002

\u6848\u4F8B\u751F\u7406\u60C5\u5883\uFF1A81\u6B72\u5973\u6027\u3001\u4F4E\u8840\u58D3(90/50)\u3001\u5FC3\u640F\u904E\u6162(35\u4E0B/\u5206)\u3001\u9AD4\u6DB2\u504F\u4E7E\u3001\u670D\u7528\u591A\u7A2EAV nodal block\u8207ACEI/ARB\u85E5\u7269\uFF0C\u6700\u7D42\u8A3A\u65B7\u70BA BRASH Syndrome\u3002
\u4F60\u8981\u64B0\u5BEB\u4E00\u7BC7\u5927\u7D04 250 - 350 \u5B57\u7684\u5C08\u696D\u5C0E\u5E2B\u5831\u544A\uFF0C\u53E3\u982D\u89AA\u5207\u4E14\u5B57\u5B57\u73E0\u74A3(\u5C08\u696D\u81E8\u5E8A\u540D\u8A5E)\uFF0C\u5305\u542B\uFF1A
1. \u81E8\u5E8A\u512A\u52E2\u5206\u6790 (\u57FA\u65BC\u8003\u751F\u80FD\u9054\u6210\u7684 checklist)\u3002
2. \u81E8\u5E8A\u76F2\u9EDE\u63A2\u8A0E\u3002
3. \u6025\u8A3A\u5C08\u79D1\u81E8\u5E8A\u6307\u5C0E\uFF1A\u4F8B\u5982\u63D0\u9192\u300CBRASH\u75C5\u56E0\u5728\u65BC\u812B\u6C34\u8207\u85E5\u7269\u84C4\u7A4D\uFF0C\u6CBB\u7642\u4E0D\u61C9\u50C5\u4E00\u6627\u6A5F\u68B0\u6027\u6D17\u814E\uFF0C\u66F4\u61C9\u7ACB\u523B\u7D66\u4E88 Calcium Gluconate / Isotonic Fluid \u4E26\u505C\u7528 AV blocker \u52A0\u5F37\u704C\u6D41\u300D\u3002`;
    const prompt = `\u8ACB\u8A55\u91CF\u4EE5\u4E0B\u8003\u751F\u8868\u73FE\u4E26\u64B0\u5BEB\u5831\u544A\uFF1A
\u8003\u751F\u59D3\u540D: ${candidateName} (${hospital}\u6025\u8A3A\u4F4F\u9662\u91AB\u5E2B)
\u672C\u6B21\u7D9C\u5408\u8A55\u5206\u6210\u7E3E: ${overallPercentage}%
\u8003\u5B98\u73FE\u5834\u96A8\u624B\u7B46\u8A18: "${examinerNotes || "\u8868\u73FE\u898F\u77E9\u4E14\u7A4D\u6975\uFF0C\u7D30\u7BC0\u53EF\u66F4\u6709\u7D44\u7E54"}"

\u8003\u751F\u8868\u73FE\u72C0\u614B (Checklist Check-off)\uFF1A
- \u75C5\u53F2\u8A62\u554F\u5B8C\u6210\u5EA6: ${checklistState.historyChecked} / 8 \u9805
- \u8EAB\u9AD4\u8A3A\u5BDF\u5B8C\u6210\u5EA6: ${checklistState.physicalChecked} / 5 \u9805
- \u4E3B\u52D5\u5B89\u6392\u4E4B\u6AA2\u67E5\u9805\u76EE: ${checklistState.investigationsChecked} / 3 \u9805
- \u6CBB\u7642\u8655\u771F\u8207\u964D\u8840\u9240\u638C\u63E1\u5EA6: ${checklistState.treatmentChecked} / 5 \u9805

\u8ACB\u4F9D\u64DA\u4E0A\u8FF0\u6578\u64DA\u8207\u8003\u5B98\u96A8\u624B\u7B46\u8A18\uFF0C\u70BA\u4ED6\u751F\u6210\u4E00\u4EFD\u683C\u5F0F\u96C5\u7DFB\u7684\u7E41\u9AD4\u4E2D\u6587\u8A55\u6838\u5C0F\u8A9E\uFF0C\u5FC5\u9808\u5305\u542B\u300C\u512A\u52E2\u8A55\u9451\u300D\u3001\u300C\u5F85\u88DC\u8DB3\u81E8\u5E8A\u76F2\u9EDE\u300D\u8207\u300C\u5C08\u79D1\u81E8\u5E8A\u6559\u5B78\uFF08\u7279\u5225\u63D0\u53CA Calcium \u4FDD\u8B77\u5FC3\u808C\u8207 BRASH \u60E1\u6027\u5FAA\u74B0\u6A5F\u5236\uFF09\u300D\u4E09\u90E8\u5206\u3002`;
    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7
      }
    });
    const aiText = response.text || fallbackResponse;
    res.json({
      success: true,
      feedback: aiText
    });
  } catch (error) {
    console.error("Gemini API Feedback Error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "\u7522\u751F AI \u8A55\u6838\u56DE\u994B\u6642\u767C\u751F\u932F\u8AA4"
    });
  }
});
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`EM Resident Interview Server available on port ${PORT}`);
  });
}
setupServer();
//# sourceMappingURL=server.cjs.map
