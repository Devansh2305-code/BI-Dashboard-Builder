import React, { useState, useRef } from "react";
import { 
  Upload, 
  FileSpreadsheet, 
  Database, 
  Plus, 
  AlertCircle, 
  ArrowRight,
  ClipboardPaste,
  RefreshCw
} from "lucide-react";
import { parseCSV, parseExcel } from "../utils";
import { Role, ColumnMetadata } from "../types";

interface RawDataImporterProps {
  activeRole: Role;
  onImport: (data: any[], columns: ColumnMetadata[]) => void;
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


  // Parse pasted raw CSV content
  const handleParsePastedCSV = () => {
    setError(null);
    if (!csvText.trim()) {
      setError("Please paste some CSV content before importing.");
      return;
    }
    try {
      const result = parseCSV(csvText);
      if (result.data.length === 0) {
        setError("Could not parse any rows. Check your CSV formatting.");
        return;
      }
      onImport(result.data, result.columns);
    } catch (e: any) {
      setError(`Parsing failed: ${e.message}`);
    }
  };

  // File change handlers
  const processUploadedFile = (file: File) => {
    setError(null);
    const fileName = file.name.toLowerCase();
    const isCSV = fileName.endsWith(".csv");
    const isExcel = fileName.endsWith(".xlsx") || fileName.endsWith(".xls");

    if (!isCSV && !isExcel) {
      setError("Unsupported file type. Please upload a .csv, .xlsx, or .xls file.");
      return;
    }

    const reader = new FileReader();
    if (isExcel) {
      reader.onload = (e) => {
        const buffer = e.target?.result;
        if (buffer instanceof ArrayBuffer) {
          try {
            const result = parseExcel(buffer);
            if (result.data.length === 0) {
              setError("The uploaded Excel file is empty or contains no valid sheets.");
              return;
            }
            onImport(result.data, result.columns);
          } catch (err: any) {
            setError(`Error reading Excel: ${err.message}`);
          }
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text === "string") {
          try {
            const result = parseCSV(text);
            if (result.data.length === 0) {
              setError("The uploaded CSV file is empty or corrupted.");
              return;
            }
            onImport(result.data, result.columns);
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
    <div id="data-importer-container" className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-w-3xl mx-auto my-6">
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
  );
}
