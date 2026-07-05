import { useState, useEffect, useRef, FormEvent, MouseEvent } from "react";
import {
  Wrench,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Activity,
  FileText,
  WifiOff,
  Wifi,
  Search,
  Clock,
  Trash2,
  Info,
  Gauge,
  Database,
  Cpu,
  CornerDownRight,
  Check,
  Sparkles,
  RefreshCw,
  Layers,
  Calendar,
  AlertCircle
} from "lucide-react";

// Secure XSS sanitization helper
function sanitizeInput(val: string): string {
  if (!val) return "";
  return val
    .trim()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

interface VehicleSpecs {
  isValid: boolean;
  confidence: number;
  normalizedMake: string;
  normalizedModel: string;
  normalizedYear: number;
  type: string;
  engine: string;
  fuelType: string;
  oilSpec: string;
  tirePressure: string;
  coolantCapacity: string;
  commonIssues: string[];
  recalls: string[];
  maintenanceSchedule: string[];
  typoCorrected: boolean;
  originalMake: string;
  originalModel: string;
  dataSource: "gemini_ai" | "local_database_fallback";
  offlineStatus?: string;
  networkError?: boolean;
}

interface HistoryItem {
  id: string;
  timestamp: string;
  year: number;
  make: string;
  model: string;
  specs: VehicleSpecs;
}

interface TelemetryLog {
  time: string;
  message: string;
}

export default function App() {
  // Input fields (sanitized on update)
  const [yearInput, setYearInput] = useState<string>("");
  const [makeInput, setMakeInput] = useState<string>("");
  const [modelInput, setModelInput] = useState<string>("");

  // Validation feedback
  const [errors, setErrors] = useState<{ year?: string; make?: string; model?: string }>({});

  // Backend state
  const [supportedMakes, setSupportedMakes] = useState<string[]>([]);
  const [suggestedModels, setSuggestedModels] = useState<string[]>([]);
  const [loadingModels, setLoadingModels] = useState<boolean>(false);

  // Validation output & state
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [validationProgress, setValidationProgress] = useState<string>("");
  const [activeReport, setActiveReport] = useState<VehicleSpecs | null>(null);

  // Network Simulation Toggles
  const [simulateOffline, setSimulateOffline] = useState<boolean>(false);
  const [simulateDelay, setSimulateDelay] = useState<boolean>(false);

  // Session History
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem("validator_history_v1");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Telemetry logs
  const [telemetryLogs, setTelemetryLogs] = useState<TelemetryLog[]>([
    {
      time: new Date().toLocaleTimeString(),
      message: "[System] Car Make/Model Validator initialized."
    }
  ]);

  // References
  const makeInputRef = useRef<HTMLInputElement>(null);
  const modelInputRef = useRef<HTMLInputElement>(null);

  // Trigger telemetry log
  const logTelemetry = (message: string) => {
    const formatted = `[Analytics] ${message}`;
    console.log(formatted);
    setTelemetryLogs((prev) => [
      { time: new Date().toLocaleTimeString(), message: formatted },
      ...prev.slice(0, 49) // Keep last 50 entries
    ]);
  };

  // Fetch standard makes on load
  useEffect(() => {
    const fetchMakes = async () => {
      try {
        const response = await fetch("/api/makes");
        if (response.ok) {
          const data = await response.json();
          setSupportedMakes(data.makes || []);
        }
      } catch (err) {
        console.error("Failed to load standard makes", err);
      }
    };
    fetchMakes();
  }, []);

  // Fetch standard models whenever make changes
  useEffect(() => {
    if (!makeInput.trim()) {
      setSuggestedModels([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setLoadingModels(true);
      try {
        const response = await fetch(`/api/models?make=${encodeURIComponent(makeInput.trim())}`);
        if (response.ok) {
          const data = await response.json();
          setSuggestedModels(data.models || []);
        }
      } catch (err) {
        console.error("Failed to load models for make", err);
      } finally {
        setLoadingModels(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [makeInput]);

  // Handle local storage update
  useEffect(() => {
    localStorage.setItem("validator_history_v1", JSON.stringify(history));
  }, [history]);

  // Form submission / Validation trigger
  const handleValidate = async (e?: FormEvent) => {
    if (e) e.preventDefault();

    // 1. Sanitize values before evaluating
    const sanitizedYear = sanitizeInput(yearInput);
    const sanitizedMake = sanitizeInput(makeInput);
    const sanitizedModel = sanitizeInput(modelInput);

    // 2. Client-side input validation
    const newErrors: { year?: string; make?: string; model?: string } = {};
    const parsedYear = parseInt(sanitizedYear, 10);

    if (!sanitizedYear) {
      newErrors.year = "Vehicle year is required.";
    } else if (isNaN(parsedYear) || parsedYear < 1900 || parsedYear > 2027) {
      newErrors.year = "Enter a valid year between 1900 and 2027.";
    }

    if (!sanitizedMake) {
      newErrors.make = "Manufacturer/make is required.";
    }

    if (!sanitizedModel) {
      newErrors.model = "Vehicle model is required.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      logTelemetry(`Validation blocked due to malformed input fields.`);
      return;
    }

    setErrors({});
    setIsValidating(true);
    setActiveReport(null);

    // 3. Simulated progress steps to mimic diagnostic workflow
    const steps = [
      "Establishing connection to Vehicle Specs database...",
      "Parsing vehicle parameters and evaluating orthographical typos...",
      "Querying manufacturer specifications...",
      "Cross-referencing safety recalls and TSB alert history bulletins..."
    ];

    let currentStepIdx = 0;
    setValidationProgress(steps[currentStepIdx]);

    const progressTimer = setInterval(() => {
      if (currentStepIdx < steps.length - 1) {
        currentStepIdx++;
        setValidationProgress(steps[currentStepIdx]);
      }
    }, simulateDelay ? 800 : 250);

    try {
      const response = await fetch("/api/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          make: sanitizedMake,
          model: sanitizedModel,
          year: sanitizedYear,
          simulateOffline,
          simulateDelay
        })
      });

      clearInterval(progressTimer);

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to validate specifications.");
      }

      const reportData: VehicleSpecs = await response.json();
      setActiveReport(reportData);

      // Append to local persistent session history
      const newHistoryItem: HistoryItem = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        year: reportData.normalizedYear,
        make: reportData.normalizedMake,
        model: reportData.normalizedModel,
        specs: reportData
      };

      setHistory((prev) => [newHistoryItem, ...prev.filter(item => 
        !(item.make.toLowerCase() === reportData.normalizedMake.toLowerCase() && 
          item.model.toLowerCase() === reportData.normalizedModel.toLowerCase() && 
          item.year === reportData.normalizedYear)
      )].slice(0, 20)); // Limit to 20 history items

      // CRITICAL: Log simulated telemetry ping precisely as requested
      logTelemetry(`User interacted with Car Make/Model Validator (Validated: ${reportData.normalizedYear} ${reportData.normalizedMake} ${reportData.normalizedModel})`);

    } catch (err: any) {
      clearInterval(progressTimer);
      console.error(err);
      setErrors({ make: err.message || "An unexpected network error occurred." });
      logTelemetry(`Network error occurred while validating vehicle.`);
    } finally {
      setIsValidating(false);
      setValidationProgress("");
    }
  };

  const loadQuickSpec = (year: string, make: string, model: string) => {
    setYearInput(year);
    setMakeInput(make);
    setModelInput(model);
    setErrors({});
    logTelemetry(`Selected Quick Spec shortcut: ${year} ${make} ${model}`);
  };

  const loadHistoryItem = (item: HistoryItem) => {
    setYearInput(item.year.toString());
    setMakeInput(item.make);
    setModelInput(item.model);
    setActiveReport(item.specs);
    setErrors({});
    logTelemetry(`Restored historical report for ${item.year} ${item.make} ${item.model}`);
  };

  const deleteHistoryItem = (id: string, e: MouseEvent) => {
    e.stopPropagation();
    setHistory((prev) => prev.filter((item) => item.id !== id));
    logTelemetry(`Removed item from persistent history registry.`);
  };

  const clearHistory = () => {
    setHistory([]);
    logTelemetry(`Cleared all local validation history records.`);
  };

  const resetForm = () => {
    setYearInput("");
    setMakeInput("");
    setModelInput("");
    setErrors({});
    setActiveReport(null);
    logTelemetry(`Cleared lookup form entries.`);
  };

  // Pre-fill fields for simple test rigs
  const quickSpecs = [
    { year: "2021", make: "Toyota", model: "Camry" },
    { year: "2023", make: "Honda", model: "Civic" },
    { year: "2022", make: "Ford", model: "F-150" },
    { year: "2023", make: "Tesla", model: "Model 3" },
    { year: "2020", make: "Jeep", model: "Wrangler" }
  ];

  return (
    <div className="min-h-screen bg-[#05070b] text-emerald-100 font-mono flex flex-col antialiased selection:bg-emerald-950 selection:text-emerald-300">
      
      {/* 1. Header Toolbar */}
      <header className="border-b border-emerald-900/40 bg-[#080d16]/95 sticky top-0 z-40 backdrop-blur-md px-4 py-4 md:px-8 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.6)]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-950/40 rounded-lg border border-emerald-800/40 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)] flex items-center justify-center">
            <Wrench className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-wider text-white flex items-center gap-2">
              <span className="text-emerald-500 font-mono">&gt;_</span> VEHICLE_DEV_VALIDATOR <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/40 font-bold">SYSTEM_V3.0</span>
            </h1>
            <p className="text-[11px] text-emerald-500/70 font-mono uppercase tracking-widest">// AUTOMOTIVE SOURCE CODE AND SPECIFICATION VERIFIER</p>
          </div>
        </div>

        {/* Connection Diagnostics and Simulators */}
        <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#0a101a] border border-emerald-950">
            {simulateOffline ? (
              <>
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-amber-400 font-semibold uppercase tracking-wider text-[10px]">MODE: LOCAL_FALLBACK_OFFLINE</span>
              </>
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 font-bold uppercase tracking-wider text-[10px]">MODE: AI_CLOUD_SERVICE_ACTIVE</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 bg-[#090e17] p-1 rounded-md border border-emerald-950">
            <button
              onClick={() => {
                setSimulateOffline(!simulateOffline);
                logTelemetry(`Toggled Force Offline Mode to: ${!simulateOffline}`);
              }}
              className={`px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider transition-colors ${
                simulateOffline
                  ? "bg-amber-600 text-slate-950"
                  : "bg-transparent text-emerald-500/60 hover:text-emerald-300"
              }`}
              title="Forces lookup to use the offline local shop database and robust typo-corrector"
              aria-label="Toggle force offline mode simulation"
            >
              Offline_Db
            </button>
            <button
              onClick={() => {
                setSimulateDelay(!simulateDelay);
                logTelemetry(`Toggled Slow Connection Simulation to: ${!simulateDelay}`);
              }}
              className={`px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider transition-colors ${
                simulateDelay
                  ? "bg-emerald-600 text-slate-950"
                  : "bg-transparent text-emerald-500/60 hover:text-emerald-300"
              }`}
              title="Delays the API endpoint by 3 seconds to test 3G loading states"
              aria-label="Toggle spotty network delay simulation"
            >
              3G_Latency
            </button>
          </div>
        </div>
      </header>


      {/* 2. Main Terminal Grid Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Inputs, Diagnostics & Helpers (5 Columns) */}
        <section className="lg:col-span-5 flex flex-col gap-6" aria-labelledby="form-section-title">
          <h2 id="form-section-title" className="sr-only">Vehicle Input and Quick Lookup Forms</h2>
          
          {/* Card: Verification Input Form */}
          <div className="bg-[#080d16] rounded-xl border border-emerald-900/40 p-5 shadow-[0_0_20px_rgba(16,185,129,0.05)] relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-emerald-500" />
            
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white text-xs tracking-wider uppercase flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                // QUERY_PARAMS_INPUT
              </h3>
              <button
                onClick={resetForm}
                className="text-xs text-emerald-500/60 hover:text-emerald-400 transition-colors flex items-center gap-1.5 font-mono"
                title="Reset input fields"
                aria-label="Reset lookup form"
              >
                <RefreshCw className="w-3 h-3" />
                CLEAR_BUFFER
              </button>
            </div>

            <form onSubmit={handleValidate} className="space-y-4">
              {/* Year Input */}
              <div>
                <label htmlFor="vehicle-year" className="block text-[11px] font-bold text-emerald-500/80 uppercase tracking-widest mb-1.5">
                  MODEL_YEAR <span className="text-emerald-700 font-normal">(1900 - 2027)</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-emerald-600 pointer-events-none">
                    <Calendar className="w-4 h-4" />
                  </span>
                  <input
                    id="vehicle-year"
                    type="number"
                    min="1900"
                    max="2027"
                    placeholder="e.g., 2023"
                    value={yearInput}
                    onChange={(e) => {
                      const sanitized = sanitizeInput(e.target.value);
                      setYearInput(sanitized);
                      if (errors.year) setErrors((prev) => ({ ...prev, year: undefined }));
                    }}
                    className={`w-full bg-[#040810] border rounded-lg pl-10 pr-4 py-2.5 text-sm text-emerald-300 placeholder-emerald-900/60 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all font-mono ${
                      errors.year
                        ? "border-red-600 focus:ring-red-500/20"
                        : "border-emerald-950 focus:border-emerald-700/80"
                    }`}
                    aria-describedby={errors.year ? "year-error" : undefined}
                    aria-invalid={!!errors.year}
                    required
                  />
                </div>
                {errors.year && (
                  <p id="year-error" className="mt-1.5 text-xs text-red-500 flex items-center gap-1" role="alert">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    {errors.year}
                  </p>
                )}

                {/* Quick Year Shortcuts */}
                <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1 scrollbar-thin">
                  {["2024", "2023", "2022", "2020", "2018"].map((yr) => (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => {
                        setYearInput(yr);
                        if (errors.year) setErrors((prev) => ({ ...prev, year: undefined }));
                        logTelemetry(`Selected fast year: ${yr}`);
                      }}
                      className={`text-[11px] px-2.5 py-1 rounded font-mono border transition-all flex-shrink-0 ${
                        yearInput === yr
                          ? "bg-emerald-500 text-slate-950 font-black border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                          : "bg-[#040810] text-emerald-600/80 border-emerald-950 hover:text-emerald-400 hover:border-emerald-900"
                      }`}
                      aria-label={`Select model year ${yr}`}
                    >
                      {yr}
                    </button>
                  ))}
                </div>
              </div>

              {/* Manufacturer / Make Input */}
              <div>
                <label htmlFor="vehicle-make" className="block text-[11px] font-bold text-emerald-500/80 uppercase tracking-widest mb-1.5">
                  MANUFACTURER_MAKE
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-emerald-600 pointer-events-none">
                    <Cpu className="w-4 h-4" />
                  </span>
                  <input
                    id="vehicle-make"
                    ref={makeInputRef}
                    type="text"
                    list="makes-list"
                    placeholder="e.g., Toyota or spell like Toyta"
                    value={makeInput}
                    onChange={(e) => {
                      const sanitized = sanitizeInput(e.target.value);
                      setMakeInput(sanitized);
                      if (errors.make) setErrors((prev) => ({ ...prev, make: undefined }));
                    }}
                    className={`w-full bg-[#040810] border rounded-lg pl-10 pr-4 py-2.5 text-sm text-emerald-300 placeholder-emerald-900/60 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all font-mono ${
                      errors.make
                        ? "border-red-600 focus:ring-red-500/20"
                        : "border-emerald-950 focus:border-emerald-700/80"
                    }`}
                    aria-describedby={errors.make ? "make-error" : undefined}
                    aria-invalid={!!errors.make}
                    required
                  />
                  <datalist id="makes-list">
                    {supportedMakes.map((m) => (
                      <option key={m} value={m} />
                    ))}
                  </datalist>
                </div>
                {errors.make && (
                  <p id="make-error" className="mt-1.5 text-xs text-red-500 flex items-center gap-1" role="alert">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    {errors.make}
                  </p>
                )}

                {/* Popular Brand Fast-Chips */}
                <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1 scrollbar-thin">
                  {["Toyota", "Honda", "Ford", "Chevrolet", "Tesla"].map((mk) => (
                    <button
                      key={mk}
                      type="button"
                      onClick={() => {
                        setMakeInput(mk);
                        if (errors.make) setErrors((prev) => ({ ...prev, make: undefined }));
                        logTelemetry(`Selected brand shortcut: ${mk}`);
                      }}
                      className={`text-[11px] px-2.5 py-1 rounded font-mono border transition-all flex-shrink-0 ${
                        makeInput === mk
                          ? "bg-emerald-500 text-slate-950 font-black border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                          : "bg-[#040810] text-emerald-600/80 border-emerald-950 hover:text-emerald-400 hover:border-emerald-900"
                      }`}
                      aria-label={`Select manufacturer ${mk}`}
                    >
                      {mk}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vehicle Model Input */}
              <div>
                <label htmlFor="vehicle-model" className="block text-[11px] font-bold text-emerald-500/80 uppercase tracking-widest mb-1.5">
                  VEHICLE_MODEL
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-emerald-600 pointer-events-none">
                    <Layers className="w-4 h-4" />
                  </span>
                  <input
                    id="vehicle-model"
                    ref={modelInputRef}
                    type="text"
                    list="models-list"
                    placeholder={loadingModels ? "Loading models..." : "e.g., Camry or spell like Camree"}
                    value={modelInput}
                    onChange={(e) => {
                      const sanitized = sanitizeInput(e.target.value);
                      setModelInput(sanitized);
                      if (errors.model) setErrors((prev) => ({ ...prev, model: undefined }));
                    }}
                    className={`w-full bg-[#040810] border rounded-lg pl-10 pr-4 py-2.5 text-sm text-emerald-300 placeholder-emerald-900/60 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all font-mono ${
                      errors.model
                        ? "border-red-600 focus:ring-red-500/20"
                        : "border-emerald-950 focus:border-emerald-700/80"
                    }`}
                    aria-describedby={errors.model ? "model-error" : undefined}
                    aria-invalid={!!errors.model}
                    required
                  />
                  <datalist id="models-list">
                    {suggestedModels.map((m) => (
                      <option key={m} value={m} />
                    ))}
                  </datalist>
                </div>
                {errors.model && (
                  <p id="model-error" className="mt-1.5 text-xs text-red-500 flex items-center gap-1" role="alert">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    {errors.model}
                  </p>
                )}

                {/* Inline loading or help state */}
                {suggestedModels.length > 0 && (
                  <p className="mt-1.5 text-[10px] text-emerald-600/75 font-mono flex items-center gap-1">
                    <CornerDownRight className="w-3 h-3 text-emerald-700" />
                    Buffer verified: {suggestedModels.length} standard records detected.
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isValidating}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-black py-3 px-4 rounded-lg text-xs flex items-center justify-center gap-2 border border-emerald-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(16,185,129,0.35)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] active:translate-y-px animate-pulse"
                  aria-label="Validate vehicle make and model"
                >
                  {isValidating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-slate-900" />
                      <span>INITIALIZING_PIPELINE...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-slate-950" />
                      <span>COMPILE & VALIDATE SPEC</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Quick Click Testing Bay (Happy Path helper) */}
          <div className="bg-[#080d16] rounded-xl border border-emerald-900/40 p-5 shadow-[0_0_20px_rgba(16,185,129,0.05)]">
            <h3 className="font-bold text-white text-xs tracking-wider uppercase mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              // INTERACTIVE_QUICK_PRESETS
            </h3>
            <p className="text-xs text-emerald-500/60 mb-4 font-mono leading-relaxed">
              Click any typical vehicle specs card below to auto-populate the form buffer and validate instantly.
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {quickSpecs.map((item) => (
                <button
                  key={`${item.make}-${item.model}`}
                  type="button"
                  onClick={() => {
                    loadQuickSpec(item.year, item.make, item.model);
                  }}
                  className="bg-[#040810] hover:bg-emerald-950/20 border border-emerald-950 p-2.5 rounded-lg text-left transition-all group flex flex-col justify-between hover:border-emerald-700/60"
                  aria-label={`Load preset specs for ${item.year} ${item.make} ${item.model}`}
                >
                  <div>
                    <span className="text-[10px] text-emerald-600/60 font-mono tracking-wider block">[{item.year}]</span>
                    <span className="text-xs font-bold text-emerald-300 group-hover:text-emerald-200 transition-colors">
                      {item.make} {item.model}
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-500 font-mono mt-1.5 flex items-center gap-0.5 group-hover:text-emerald-400">
                    &gt;_ LOAD_BUFFER &rarr;
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>


        {/* Right Side: Specifications Results Report Display (7 Columns) */}
        <section className="lg:col-span-7 flex flex-col gap-6" aria-labelledby="report-section-title">
          <h2 id="report-section-title" className="sr-only">Detailed Validation Report Panel</h2>
          
          <div className="bg-[#080d16] rounded-xl border border-emerald-900/40 shadow-[0_0_30px_rgba(16,185,129,0.02)] overflow-hidden flex-1 flex flex-col min-h-[480px]">
            {/* Header tab structure representing auto terminal sheet */}
            <div className="bg-[#040810] px-5 py-3.5 border-b border-emerald-950/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-black text-emerald-400 uppercase tracking-widest font-mono">// SPECIFICATION_VALIDATION_BULLETIN</span>
              </div>
              {activeReport && (
                <span className="text-[10px] px-2 py-0.5 font-mono rounded bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                  REF_ID: #{activeReport.normalizedYear}{activeReport.normalizedMake.slice(0,3).toUpperCase()}{activeReport.normalizedModel.slice(0,3).toUpperCase()}
                </span>
              )}
            </div>

            {/* Content area based on states */}

            {/* 1. Loading state */}
            {isValidating && (
              <div className="flex-1 p-6 md:p-8 flex flex-col items-center justify-center text-center space-y-6" role="status" aria-live="polite">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-emerald-950 border-t-emerald-400 rounded-full animate-spin" />
                  <Wrench className="w-6 h-6 text-emerald-400 absolute inset-0 m-auto animate-pulse" />
                </div>
                <div className="space-y-2 max-w-md">
                  <p className="font-bold text-emerald-400 tracking-wider text-xs font-mono animate-pulse uppercase">
                    {validationProgress}
                  </p>
                  <p className="text-xs text-emerald-600/70 leading-relaxed font-mono">
                    Establishing simulated pipeline. If connection delays are simulated, please stand by while the digital lookup validates mechanical configurations.
                  </p>
                </div>

                {/* Simulated Diagnostic Term */}
                <div className="w-full bg-[#020408] rounded-lg p-3 border border-emerald-950/80 font-mono text-[11px] text-left text-emerald-500 max-w-sm space-y-1">
                  <p className="text-emerald-700">// ACTIVE DIAGNOSTIC SEQUENCE //</p>
                  <p>&gt; Connection State: {simulateOffline ? "OFFLINE_LOCAL_DICTIONARY" : "ONLINE_GEMINI_API"}</p>
                  <p>&gt; Request Payload: {yearInput || "NULL"}/{makeInput || "NULL"}/{modelInput || "NULL"}</p>
                  <p className="text-emerald-400">&gt; Query Status: {validationProgress}</p>
                </div>
              </div>
            )}

            {/* 2. Empty state / Welcome state */}
            {!isValidating && !activeReport && (
              <div className="flex-1 p-6 md:p-12 flex flex-col items-center justify-center text-center space-y-5">
                <div className="w-16 h-16 rounded-full bg-[#040810] border border-emerald-950 flex items-center justify-center text-emerald-500 shadow-inner">
                  <Activity className="w-7 h-7 animate-pulse" />
                </div>
                <div className="max-w-md space-y-2">
                  <h4 className="font-bold text-white text-sm uppercase tracking-wider">// SYSTEM READY FOR QUERY INPUT</h4>
                  <p className="text-xs text-emerald-600/70 leading-relaxed font-mono">
                    Enter any vehicle make and model to inspect exact fluid specifications, engine details, safety recalls, and standard maintenance instructions.
                  </p>
                </div>
                <div className="text-[11px] font-mono text-emerald-400 bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-900/30">
                  Enter parameters or select an interactive quick preset card.
                </div>
              </div>
            )}

            {/* 3. Report display state */}
            {!isValidating && activeReport && (
              <div className="flex-1 p-5 md:p-6 space-y-6 overflow-y-auto">
                
                {/* Badge Header: Valid/Invalid specification status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-emerald-950/80">
                  <div className="space-y-1">
                    <div className="text-[10px] font-mono text-emerald-500/75 tracking-wider uppercase">// ACTIVE REGISTERED VEHICLE REPORT</div>
                    <h3 className="text-xl font-bold text-white tracking-tight">
                      {activeReport.normalizedYear} {activeReport.normalizedMake} {activeReport.normalizedModel}
                    </h3>
                  </div>

                  <div>
                    {activeReport.isValid ? (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/50 border border-emerald-800 text-emerald-400 text-xs font-bold font-mono uppercase" role="status">
                        <CheckCircle2 className="w-4 h-4" />
                        Validated Spec [Conf: {(activeReport.confidence * 100).toFixed(0)}%]
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-950/50 border border-amber-800 text-amber-400 text-xs font-bold font-mono uppercase" role="status">
                        <ShieldAlert className="w-4 h-4" />
                        Unrecognized Model [Conf: {(activeReport.confidence * 100).toFixed(0)}%]
                      </div>
                    )}
                  </div>
                </div>

                {/* Alert for spelling correction */}
                {activeReport.typoCorrected && (
                  <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-800/40 text-amber-300 text-xs flex items-start gap-2.5 font-mono">
                    <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" />
                    <div>
                      <p className="font-bold">Typographical Auto-Correction Applied</p>
                      <p className="text-emerald-300/80 font-normal mt-0.5">
                        Spelling correction resolved original request <span className="bg-amber-950/80 px-1 py-0.5 rounded text-[11px] font-bold">"{activeReport.originalMake} {activeReport.originalModel}"</span> to validated specification: <span className="font-bold">{activeReport.normalizedMake} {activeReport.normalizedModel}</span>.
                      </p>
                    </div>
                  </div>
                )}

                {/* Unrecognized Model Warning Block if invalid */}
                {!activeReport.isValid && (
                  <div className="p-4 rounded-lg bg-red-950/20 border border-red-900/40 text-red-300 text-xs space-y-2 font-mono">
                    <div className="flex items-center gap-2 text-red-400 font-bold">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      UNCONFIRMED OR HISTORICAL MANUFACTURING SPECIFICATION
                    </div>
                    <p className="text-emerald-300/80 leading-relaxed font-normal">
                      The vehicle you requested could not be definitively validated in standard commercial registries for this model year. Specifications displayed below reflect closest fallback calculations.
                    </p>
                  </div>
                )}

                {/* Section A: Bento Grid of Technical Specs */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold tracking-wider text-emerald-400/80 uppercase font-mono flex items-center gap-2">
                    <span>🔧</span> // MECHANICAL_FLUIDS_BAY_SPECS
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    
                    {/* Card 1: Engine Specification */}
                    <div className="bg-[#040810] p-3 rounded-lg border border-emerald-950 space-y-1.5 hover:border-emerald-900/40 transition-colors">
                      <div className="text-[10px] text-emerald-500/60 uppercase tracking-wider font-mono">Engine Block</div>
                      <div className="text-xs font-bold text-white line-clamp-2">{activeReport.engine}</div>
                    </div>

                    {/* Card 2: Recommended Oil Weight & Cap */}
                    <div className="bg-[#040810] p-3 rounded-lg border border-emerald-950 space-y-1.5 relative group hover:border-emerald-900/40 transition-colors">
                      <div className="text-[10px] text-emerald-500/60 uppercase tracking-wider font-mono flex items-center justify-between">
                        <span>Oil Spec & Cap</span>
                        <Gauge className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                      <div className="text-xs font-bold text-emerald-300 group-hover:text-white transition-colors">{activeReport.oilSpec}</div>
                    </div>

                    {/* Card 3: Tire Inflation Specification */}
                    <div className="bg-[#040810] p-3 rounded-lg border border-emerald-950 space-y-1.5 hover:border-emerald-900/40 transition-colors">
                      <div className="text-[10px] text-emerald-500/60 uppercase tracking-wider font-mono">Tire Pressure Spec</div>
                      <div className="text-xs font-bold text-emerald-300">{activeReport.tirePressure}</div>
                    </div>

                    {/* Card 4: Coolant Volume */}
                    <div className="bg-[#040810] p-3 rounded-lg border border-emerald-950 space-y-1.5 hover:border-emerald-900/40 transition-colors">
                      <div className="text-[10px] text-emerald-500/60 uppercase tracking-wider font-mono">Coolant Capacity</div>
                      <div className="text-xs font-bold text-emerald-300">{activeReport.coolantCapacity}</div>
                    </div>

                    {/* Card 5: Fuel Grade */}
                    <div className="bg-[#040810] p-3 rounded-lg border border-emerald-950 space-y-1.5 hover:border-emerald-900/40 transition-colors">
                      <div className="text-[10px] text-emerald-500/60 uppercase tracking-wider font-mono">Fuel System Type</div>
                      <div className="text-xs font-bold text-emerald-300">{activeReport.fuelType}</div>
                    </div>

                    {/* Card 6: Body Category */}
                    <div className="bg-[#040810] p-3 rounded-lg border border-emerald-950 space-y-1.5 hover:border-emerald-900/40 transition-colors">
                      <div className="text-[10px] text-emerald-500/60 uppercase tracking-wider font-mono">Vehicle Class</div>
                      <div className="text-xs font-bold text-emerald-300">{activeReport.type}</div>
                    </div>
                  </div>
                </div>

                {/* Section B: Safety Bulletins & Recalls */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold tracking-wider text-emerald-400/80 uppercase font-mono flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-500" />
                    // SAFETY_RECALLS_BULLETIN
                  </h4>
                  
                  {activeReport.recalls && activeReport.recalls.length > 0 ? (
                    <div className="space-y-2">
                      {activeReport.recalls.map((recall, idx) => (
                        <div key={idx} className="bg-amber-950/20 border border-amber-900/40 p-3 rounded-lg text-xs flex items-start gap-3 text-amber-200 font-mono">
                          <span className="bg-amber-950 text-amber-400 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold flex-shrink-0 mt-0.5">RECALL</span>
                          <span className="font-normal leading-relaxed">{recall}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-[#040810] p-3.5 rounded-lg border border-emerald-950 text-xs text-emerald-500/60 flex items-center gap-2 font-mono">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>No active or critical factory safety recalls currently logged in this database.</span>
                    </div>
                  )}
                </div>

                {/* Section C: Common Mechanical Faults */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold tracking-wider text-emerald-400/80 uppercase font-mono flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-emerald-500" />
                    // COMMON_SHOP_FAULTS_FAILURE_POINTS
                  </h4>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {activeReport.commonIssues && activeReport.commonIssues.length > 0 ? (
                      activeReport.commonIssues.map((issue, idx) => (
                        <li key={idx} className="bg-[#040810] p-3 rounded-lg border border-emerald-950 text-xs text-emerald-300 flex items-start gap-2.5 font-mono hover:border-emerald-900/40 transition-colors">
                          <span className="text-emerald-500 font-mono font-bold mt-0.5">{idx + 1}.</span>
                          <span className="font-normal leading-relaxed">{issue}</span>
                        </li>
                      ))
                    ) : (
                      <li className="col-span-2 bg-[#040810] p-3 rounded-lg border border-emerald-950 text-xs text-emerald-500/60 font-mono">
                        No critical common mechanical failures reported. Standard maintenance protocols apply.
                      </li>
                    )}
                  </ul>
                </div>

                {/* Section D: Recommended Maintenance Checklist */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold tracking-wider text-emerald-400/80 uppercase font-mono flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-emerald-400" />
                    // RECOMMENDED_BAY_MAINTENANCE_SCHEDULE
                  </h4>
                  <div className="bg-[#020408] rounded-lg border border-emerald-950 overflow-hidden divide-y divide-emerald-950/80">
                    {activeReport.maintenanceSchedule && activeReport.maintenanceSchedule.length > 0 ? (
                      activeReport.maintenanceSchedule.map((step, idx) => (
                        <div key={idx} className="px-4 py-3 text-xs text-emerald-300 flex items-start gap-3 hover:bg-emerald-950/10 transition-colors font-mono">
                          <input
                            type="checkbox"
                            id={`maint-check-${idx}`}
                            className="mt-0.5 rounded border-emerald-950 bg-[#040810] text-emerald-500 focus:ring-0 focus:ring-offset-0 cursor-pointer w-3.5 h-3.5"
                            aria-label={`Mark maintenance step: ${step}`}
                          />
                          <label htmlFor={`maint-check-${idx}`} className="font-normal leading-relaxed cursor-pointer select-none">
                            {step}
                          </label>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-xs text-emerald-500/50 font-mono">
                        No standard service intervals logged. Please consult manufacture service manuals.
                      </div>
                    )}
                  </div>
                </div>

                {/* Source details */}
                <div className="pt-4 border-t border-emerald-950/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-[10px] font-mono text-emerald-500/60">
                  <div className="flex items-center gap-1.5">
                    <span>DATA_SOURCE:</span>
                    <span className="font-bold text-emerald-400">
                      {activeReport.dataSource === "gemini_ai" ? "Gemini AI Engine" : "Offline Shop Registry Fallback"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span>CONNECTION:</span>
                    <span>{activeReport.networkError ? "SPOTTY (Triggered Fallback)" : "STABLE"}</span>
                  </div>
                </div>

              </div>
            )}
          </div>
        </section>
      </main>

      {/* 3. Bottom persistent Session Registry & Telemetry Monitor */}
      <footer className="bg-[#040810] border-t border-emerald-950/80 p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 mt-auto shadow-[0_-4px_20px_rgba(0,0,0,0.4)]">
        
        {/* Persistent History (7 Columns) */}
        <section className="lg:col-span-7 space-y-3" aria-labelledby="history-section-title">
          <div className="flex items-center justify-between">
            <h3 id="history-section-title" className="text-xs font-bold uppercase tracking-wider text-emerald-500/70 font-mono flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-400" />
              // SESSION_BAY_REGISTRY ({history.length})
            </h3>
            {history.length > 0 && (
              <button
                onClick={clearHistory}
                className="text-[10px] text-red-500/80 hover:text-red-400 transition-colors font-mono uppercase font-bold"
                title="Clear verification list"
                aria-label="Clear session history"
              >
                CLEAR_STACK
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <div className="h-20 bg-[#020408] rounded-lg border border-emerald-950/80 flex items-center justify-center text-xs text-emerald-700/60 font-mono">
              [Buffer empty. No verified vehicle records in stack]
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
              {history.map((item) => {
                const isActive = activeReport && 
                  activeReport.normalizedMake === item.make && 
                  activeReport.normalizedModel === item.model && 
                  activeReport.normalizedYear === item.year;

                return (
                  <div
                    key={item.id}
                    onClick={() => loadHistoryItem(item)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        loadHistoryItem(item);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    className={`flex-shrink-0 text-left p-3 rounded-lg border transition-all w-52 relative group flex flex-col justify-between cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                      isActive
                        ? "bg-emerald-950/30 border-emerald-500 text-emerald-200"
                        : "bg-[#020408] border-emerald-950 text-emerald-400/80 hover:border-emerald-800/50"
                    }`}
                    aria-label={`Restore validation specs for ${item.year} ${item.make} ${item.model}`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[9px] text-emerald-600/60 font-mono">[{item.timestamp}]</span>
                        <button
                          type="button"
                          onClick={(e) => deleteHistoryItem(item.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-400 text-emerald-600/50 transition-all rounded"
                          title="Remove from session"
                          aria-label={`Delete ${item.year} ${item.make} ${item.model} from history`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="text-xs font-bold leading-tight line-clamp-1 text-white">{item.year} {item.make}</div>
                      <div className="text-[11px] text-emerald-500/70 line-clamp-1 mt-0.5">{item.model}</div>
                    </div>

                    <div className="mt-2.5 pt-1.5 border-t border-emerald-950/80 flex items-center justify-between text-[9px] font-mono">
                      <span className={item.specs.isValid ? "text-emerald-400 font-bold" : "text-amber-500 font-bold"}>
                        {item.specs.isValid ? "VALIDATED" : "UNCONFIRMED"}
                      </span>
                      <span className="text-emerald-700">
                        {item.specs.dataSource === "gemini_ai" ? "Gemini" : "Offline"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Live Telemetry monitor (5 Columns) */}
        <section className="lg:col-span-5 space-y-3" aria-labelledby="telemetry-section-title">
          <div className="flex items-center justify-between">
            <h3 id="telemetry-section-title" className="text-xs font-bold uppercase tracking-wider text-emerald-500/70 font-mono flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
              // TELEMETRY_STREAMS
            </h3>
            <span className="text-[9px] text-emerald-400 font-mono tracking-wider">● SYSTEM_ONLINE</span>
          </div>

          <div 
            className="h-20 bg-[#020408] rounded-lg border border-emerald-950 p-2 font-mono text-[10px] text-emerald-500/70 overflow-y-auto space-y-1 scrollbar-thin select-text"
            role="log"
            aria-label="Developer Telemetry Console Output"
          >
            {telemetryLogs.map((log, idx) => (
              <div key={idx} className="flex gap-2">
                <span className="text-emerald-800 flex-shrink-0">[{log.time}]</span>
                <span className={log.message.includes("[Analytics]") ? "text-emerald-300 font-semibold animate-pulse" : "text-emerald-500/80"}>
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Developer Attribution Footer Segment */}
        <div className="col-span-12 border-t border-emerald-950/60 pt-4 flex flex-col sm:flex-row justify-between items-center text-xs font-mono text-emerald-600/50 gap-4">
          <div>DEVICE_BUFFER // SECURE_SHELL_LINK_ACTIVE</div>
          <div className="flex items-center gap-1.5">
            built with love <span className="text-rose-500 animate-pulse text-sm">❤️</span> by <span className="font-bold text-white tracking-widest uppercase hover:text-emerald-400 transition-colors">Alok Kumar Mishra</span>
          </div>
        </div>

      </footer>


    </div>
  );
}
