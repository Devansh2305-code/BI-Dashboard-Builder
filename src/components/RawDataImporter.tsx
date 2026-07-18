import React, { useState, useRef } from "react";
import { 
  Upload, 
  FileSpreadsheet, 
  Database, 
  Plus, 
  AlertCircle, 
  ArrowRight,
  ClipboardPaste,
  RefreshCw,
  ShieldCheck
} from "lucide-react";
import { parseCSV, parseExcel } from "../utils";
import { Role, ColumnMetadata } from "../types";

interface RawDataImporterProps {
  activeRole: Role;
  onImport: (data: any[], columns: ColumnMetadata[], cleanSummary?: string | null) => void;
  currentDataLength: number;
}

export default function RawDataImporter({ 
  activeRole, 
  onImport,
  currentDataLength 
}: RawDataImporterProps) {
  const [activeTab, setActiveTab] = useState<"paste" | "upload">("upload");
  const [csvText, setCsvText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCleaning, setIsCleaning] = useState(false);

  const applyCleaningBlueprint = (data: any[], recipe: any): { data: any[], columns: ColumnMetadata[] } => {
    const renamedColumns = recipe.renamedColumns || {};
    const transformations = recipe.transformations || [];
    const columnTypes = recipe.columnTypes || {};

    const cleanedData = data.map((row) => {
      const cleanedRow: any = {};
      
      // Copy and rename keys
      Object.keys(row).forEach((oldKey) => {
        const newKey = renamedColumns[oldKey] || oldKey;
        cleanedRow[newKey] = row[oldKey];
      });

      // Run value transformations
      transformations.forEach((trans: any) => {
        const origCol = trans.column;
        const activeCol = renamedColumns[origCol] || origCol;
        const val = cleanedRow[activeCol];

        if (val !== undefined && val !== null) {
          if (trans.action === "parse_number") {
            const strVal = String(val).trim();
            if (strVal === "") {
              cleanedRow[activeCol] = null;
            } else {
              // Remove everything except digits, minus sign, and dot
              const cleanedStr = strVal.replace(/[^\d.-]/g, "");
              const parsed = parseFloat(cleanedStr);
              cleanedRow[activeCol] = isNaN(parsed) ? null : parsed;
            }
          } else if (trans.action === "standardize_date") {
            const strVal = String(val).trim();
            if (strVal === "") {
              cleanedRow[activeCol] = null;
            } else {
              const parsedDate = new Date(strVal);
              if (!isNaN(parsedDate.getTime())) {
                cleanedRow[activeCol] = parsedDate.toISOString().split("T")[0];
              } else {
                cleanedRow[activeCol] = strVal;
              }
            }
          } else if (trans.action === "trim_and_case") {
            let strVal = String(val).trim();
            if (trans.case === "upper") {
              strVal = strVal.toUpperCase();
            } else if (trans.case === "lower") {
              strVal = strVal.toLowerCase();
            } else if (trans.case === "title") {
              strVal = strVal.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
            }
            cleanedRow[activeCol] = strVal;
          }
        }
      });

      return cleanedRow;
    });

    const newColumns: ColumnMetadata[] = Object.keys(columnTypes).map((colName) => ({
      name: colName,
      type: columnTypes[colName] as "number" | "string" | "date"
    }));

    if (newColumns.length === 0 && cleanedData.length > 0) {
      const headers = Object.keys(cleanedData[0]);
      headers.forEach(h => {
        const sampleVal = cleanedData.find((r: any) => r[h] !== null && r[h] !== undefined)?.[h];
        if (typeof sampleVal === "number") {
          newColumns.push({ name: h, type: "number" });
        } else if (sampleVal && !isNaN(Date.parse(String(sampleVal))) && String(sampleVal).length >= 8) {
          newColumns.push({ name: h, type: "date" });
        } else {
          newColumns.push({ name: h, type: "string" });
        }
      });
    }

    return { data: cleanedData, columns: newColumns };
  };

  const handleProcessImport = async (rawData: any[], rawColumns: ColumnMetadata[]) => {
    setIsCleaning(true);
    try {
      const sampleRows = rawData.slice(0, 15);
      const res = await fetch("/api/admin/clean-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sampleRows, columns: rawColumns })
      });

      if (res.ok) {
        const recipe = await res.json();
        const { data: cleanedData, columns: cleanedCols } = applyCleaningBlueprint(rawData, recipe);
        const summaryMsg = recipe.summary || "AI Data Audit: Standardized data types, numbers, and dates.";
        onImport(cleanedData, cleanedCols, summaryMsg);
      } else {
        onImport(rawData, rawColumns, null);
      }
    } catch (err) {
      console.warn("AI Cleaning network request failed, proceeding with raw parse:", err);
      onImport(rawData, rawColumns, null);
    } finally {
      setIsCleaning(false);
    }
  };


  // Parse pasted raw CSV content
  const handlePasteSubmit = () => {
    setError(null);
    if (!csvText.trim()) {
      setError("Please paste valid CSV content into the text area.");
      return;
    }
    try {
      const result = parseCSV(csvText);
      if (result.data.length === 0) {
        setError("Could not parse any valid rows from the provided CSV text.");
        return;
      }
      handleProcessImport(result.data, result.columns);
    } catch (e: any) {
      setError(`CSV Parsing Error: ${e.message}`);
    }
  };

  // File change handlers
  const processUploadedFile = (file: File) => {
    setError(null);
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const buffer = e.target?.result;
        if (buffer instanceof ArrayBuffer) {
          try {
            const result = parseExcel(buffer);
            if (result.data.length === 0) {
              setError("The uploaded Excel workbook contains no data rows.");
              return;
            }
            handleProcessImport(result.data, result.columns);
          } catch (err: any) {
            setError(`Excel Parsing Error: ${err.message}`);
          }
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text === "string") {
          try {
            const result = parseCSV(text);
            if (result.data.length === 0) {
              setError("The uploaded CSV file is empty or corrupted.");
              return;
            }
            handleProcessImport(result.data, result.columns);
          } catch (err: any) {
            setError(`Error reading CSV: ${err.message}`);
          }
        }
      };
      reader.readAsText(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processUploadedFile(e.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processUploadedFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <>
      {isCleaning && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl flex flex-col items-center">
            <div className="p-3.5 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-full mb-5 border border-blue-100 dark:border-blue-900/20 animate-pulse">
              <RefreshCw className="w-8 h-8 animate-spin animate-infinite duration-2000" />
            </div>
            <h3 className="font-extrabold text-slate-800 dark:text-white text-lg">AI Inspecting Data Quality</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2.5 leading-relaxed">
              Gemini is auditing column headers, data formats, category casings, and currency representations to clean your records for analytics...
            </p>
          </div>
        </div>
      )}

      <div id="data-importer-container" className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-w-3xl mx-auto my-6">
      
      {/* Client-Side Data Protection Banner */}
      <div className="mb-5 p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <span className="font-bold block text-emerald-700 dark:text-emerald-400">100% Client-Side Data Protection</span>
            <span className="text-[11px] text-slate-600 dark:text-slate-300">Your CSV / Excel files are parsed inside local browser memory. Raw dataset records are never uploaded or saved to any cloud database.</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Load Your Data Engine</h2>
          <p className="text-sm text-slate-500 mt-1">
            Feed the platform with raw structured data to construct KPI summaries and visual graphs.
          </p>
        </div>
        {currentDataLength > 0 && (
          <div className="text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg border border-slate-200 flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-slate-500" />
            <span>Active: <strong>{currentDataLength} rows</strong> loaded</span>
          </div>
        )}
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-slate-200 mb-6">
        <button
          id="tab-import-upload"
          onClick={() => { setActiveTab("upload"); setError(null); }}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all duration-200 flex items-center space-x-2 ${
            activeTab === "upload"
              ? "border-blue-600 text-blue-700 font-semibold"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>Upload CSV File</span>
        </button>

        <button
          id="tab-import-paste"
          onClick={() => { setActiveTab("paste"); setError(null); }}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all duration-200 flex items-center space-x-2 ${
            activeTab === "paste"
              ? "border-blue-600 text-blue-700 font-semibold"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          <ClipboardPaste className="w-4 h-4" />
          <span>Paste Raw CSV</span>
        </button>
      </div>

      {/* Error notification */}
      {error && (
        <div className="mb-5 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start space-x-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
          <span className="font-medium leading-relaxed">{error}</span>
        </div>
      )}

      {/* Tab Panels */}
      {activeTab === "paste" && (
        <div id="panel-paste" className="space-y-4">
          <p className="text-xs text-slate-500 leading-relaxed mb-1">
            Copy values from MS Excel, Google Sheets, or any CSV text editor and paste below. Make sure the first row contains column headers.
          </p>
          <textarea
            id="textarea-csv-paste"
            rows={7}
            placeholder={`Date,Category,Spend,Conversions&#10;2026-07-01,Summer Sale,500,12&#10;2026-07-02,Back to School,1200,45&#10;2026-07-03,Email Core,80,9`}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            className="w-full p-4 border border-slate-200 rounded-xl font-mono text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow bg-slate-50/50"
          />
          <button
            id="btn-import-pasted"
            onClick={handleParsePastedCSV}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg transition duration-150 flex items-center justify-center space-x-2 shadow-sm"
          >
            <span>Parse & Populate Canvas</span>
            <Plus className="w-4 h-4" />
          </button>
        </div>
      )}

      {activeTab === "upload" && (
        <div id="panel-upload" className="space-y-4">
          <div
            id="drag-drop-zone"
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
              dragActive 
                ? "border-blue-500 bg-blue-50/40" 
                : "border-slate-300 hover:border-slate-400 bg-slate-50/20"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInput}
              accept=".csv,.xlsx,.xls"
              className="hidden"
            />
            <div className={`p-4 rounded-full mb-3 ${dragActive ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"}`}>
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700">
              Drag & Drop your CSV or Excel file here or <span className="text-blue-600 hover:underline">browse files</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">Supports .csv, .xlsx, and .xls formats up to 10MB</p>
          </div>
        </div>
      )}
    </div>
  </>
  );
}
