import React, { useState, useRef, useEffect, MouseEvent, TouchEvent } from 'react';
import { ESignature } from '../types';
import { Sparkles, Edit3, Type, RotateCcw, ShieldCheck, Upload } from 'lucide-react';

interface DigitalSignatureProps {
  onSave: (sig: ESignature) => void;
  defaultName: string;
  defaultPosition: string;
  actionLabel?: string;
}

export default function DigitalSignature({
  onSave,
  defaultName,
  defaultPosition,
  actionLabel = "Apply Digital Signature"
}: DigitalSignatureProps) {
  const [signType, setSignType] = useState<'draw' | 'type' | 'import'>('draw');
  const [fullName, setFullName] = useState(defaultName);
  const [position, setPosition] = useState(defaultPosition);
  const [typedFont, setTypedFont] = useState<'serif' | 'cursive' | 'mono'>('cursive');
  const [savedSig, setSavedSig] = useState<ESignature | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);

  // Import Signature states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importedImage, setImportedImage] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState('');

  // Initialize canvas drawing behavior
  useEffect(() => {
    if (signType === 'draw') {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.strokeStyle = '#10b981'; // Emerald-500 signature ink
          ctx.lineWidth = 2.5;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
        }
      }
    }
  }, [signType]);

  const startDrawing = (e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    isDrawing.current = true;
    const rect = canvas.getBoundingClientRect();
    
    // Support mouse or touch operations
    let x, y;
    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }
    
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;
    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
      e.preventDefault(); // Prevent scrolling on touch
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawing.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  // Import File processor
  const handleFile = (file: File) => {
    setFileError('');
    if (!file.type.startsWith('image/')) {
      setFileError('Unsupported format. Please upload a valid image file (PNG, JPG, JPEG, SVG).');
      return;
    }
    
    if (file.size > 3 * 1024 * 1024) {
      setFileError('The file size exceeds 3MB. Please upload a compressed signature clip.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result && typeof e.target.result === 'string') {
        setImportedImage(e.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleSave = () => {
    const nowStr = new Date().toLocaleString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    let sigValue = '';
    if (signType === 'draw') {
      const canvas = canvasRef.current;
      if (canvas) {
        sigValue = canvas.toDataURL();
      }
    } else if (signType === 'import') {
      sigValue = importedImage;
    } else {
      sigValue = fullName;
    }

    const signature: ESignature = {
      name: fullName,
      position: position,
      timestamp: nowStr,
      type: signType,
      value: sigValue
    };

    setSavedSig(signature);
    onSave(signature);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-inner mt-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-500 animate-pulse" />
          <h4 className="font-semibold text-sm text-slate-100 uppercase tracking-wider">Secured Approval Signature</h4>
        </div>
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 self-start sm:self-auto overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setSignType('draw')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
              signType === 'draw'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            Draw
          </button>
          <button
            type="button"
            onClick={() => setSignType('type')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
              signType === 'type'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            Type Keyboard
          </button>
          <button
            type="button"
            onClick={() => setSignType('import')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
              signType === 'import'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Import from Device
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Signer Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            placeholder="e.g. Kolawole Davies"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Corporate Title / Position</label>
          <input
            type="text"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
            placeholder="e.g. Financial Lead"
          />
        </div>
      </div>

      {signType === 'draw' && (
        <div className="relative animate-fadeIn">
          <div className="bg-slate-950 border border-slate-850 rounded-lg overflow-hidden relative">
            <canvas
              ref={canvasRef}
              width={500}
              height={140}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full bg-slate-950 cursor-crosshair block"
              id="signature-canvas"
            />
            <button
              type="button"
              onClick={clearCanvas}
              className="absolute bottom-2.5 right-2.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 p-1.5 rounded-md text-xs flex items-center gap-1 transition-all"
              title="Clear Sign Canvas"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Clear
            </button>
          </div>
          <p className="text-[10px] text-slate-500 mt-1.5 italic text-center text-slate-400">
            Draw your signature directly using touch or cursor drag.
          </p>
        </div>
      )}

      {signType === 'type' && (
        <div className="animate-fadeIn">
          <div className="bg-slate-950 border border-slate-850 rounded-lg min-h-[140px] flex items-center justify-center relative p-4">
            <div className="absolute top-2 left-2 flex gap-1.5">
              <button
                type="button"
                onClick={() => setTypedFont('cursive')}
                className={`px-2 py-0.5 text-[10px] font-semibold rounded ${
                  typedFont === 'cursive' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-900 text-slate-400'
                }`}
              >
                Cursive Script
              </button>
              <button
                type="button"
                onClick={() => setTypedFont('serif')}
                className={`px-2 py-0.5 text-[10px] font-semibold rounded ${
                  typedFont === 'serif' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-900 text-slate-400'
                }`}
              >
                Serif Signature
              </button>
              <button
                type="button"
                onClick={() => setTypedFont('mono')}
                className={`px-2 py-0.5 text-[10px] font-semibold rounded ${
                  typedFont === 'mono' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-900 text-slate-400'
                }`}
              >
                Classic Mono
              </button>
            </div>

            <div
              className={`text-3xl text-emerald-400 select-none text-center ${
                typedFont === 'cursive'
                  ? 'font-serif italic tracking-widest font-thin'
                  : typedFont === 'serif'
                  ? 'font-serif underline tracking-tight'
                  : 'font-mono'
              }`}
            >
              {fullName || "Your Signature Preview"}
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-1.5 italic text-center text-slate-400">
            System will securely synthesize a digital typographic vector representation model.
          </p>
        </div>
      )}

      {signType === 'import' && (
        <div className="space-y-3 animate-fadeIn">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
            id="signature-file-upload"
          />
          {importedImage ? (
            <div className="bg-slate-950 border border-slate-850 rounded-lg min-h-[140px] flex flex-col items-center justify-center p-4 relative">
              <img
                src={importedImage}
                alt="Uploaded Signature Preview"
                className="max-h-[110px] object-contain max-w-full rounded border border-slate-800 p-2 bg-slate-900/40 brightness-110"
                referrerPolicy="no-referrer"
              />
              <button
                type="button"
                onClick={() => setImportedImage('')}
                className="absolute bottom-2.5 right-2.5 bg-slate-900 border border-slate-800 text-rose-400 hover:text-rose-350 p-1.5 rounded-md text-xs flex items-center gap-1 transition-all cursor-pointer shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Change File
              </button>
            </div>
          ) : (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-6 min-h-[140px] flex flex-col items-center justify-center gap-2.5 cursor-pointer transition-all ${
                isDragging
                  ? 'border-emerald-500 bg-emerald-500/5 text-emerald-400'
                  : 'border-slate-800 bg-slate-950 hover:border-slate-700 hover:bg-[#111A2E]/40 text-slate-400'
              }`}
            >
              <Upload className="w-7 h-7 text-slate-500 animate-bounce" />
              <div className="text-center">
                <span className="text-xs font-semibold block text-slate-300">
                  Drag &amp; drop signature file here, or <span className="text-emerald-400 hover:underline">browse files</span>
                </span>
                <span className="text-[10px] text-slate-500 block mt-1 leading-normal">
                  Supports transparent PNG, JPEG, SVG clips (Max 3MB)
                </span>
              </div>
            </div>
          )}

          {fileError && (
            <p className="text-[11px] text-rose-450 leading-tight block text-center font-semibold">
              ⚠️ {fileError}
            </p>
          )}

          <p className="text-[10px] text-slate-500 mt-1.5 italic text-center text-slate-400">
            Upload a high-contrast crop of your e-signature directly from your local computer or phone.
          </p>
        </div>
      )}

      <div className="mt-5 flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={!fullName || !position || (signType === 'import' && !importedImage)}
          className="bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-55 disabled:cursor-not-allowed text-white shadow-lg text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all cursor-pointer"
          id="cmd-save-signature"
        >
          <Sparkles className="w-4 h-4" />
          {actionLabel}
        </button>
      </div>

      {savedSig && (
        <div className="mt-3 bg-emerald-950/20 border border-emerald-800/20 rounded-lg p-2.5 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-[11px] text-emerald-400">
            E-Signature capture confirmed for {savedSig.name}. Proceeding will record timestamp {savedSig.timestamp}.
          </span>
        </div>
      )}
    </div>
  );
}
