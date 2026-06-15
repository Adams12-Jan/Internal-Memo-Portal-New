import { useState, useRef, useEffect, MouseEvent, TouchEvent } from 'react';
import { ESignature } from '../types';
import { Sparkles, Edit3, Type, RotateCcw, ShieldCheck } from 'lucide-react';

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
  const [signType, setSignType] = useState<'draw' | 'type'>('draw');
  const [fullName, setFullName] = useState(defaultName);
  const [position, setPosition] = useState(defaultPosition);
  const [typedFont, setTypedFont] = useState<'serif' | 'cursive' | 'mono'>('cursive');
  const [savedSig, setSavedSig] = useState<ESignature | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);

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
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-500 animate-pulse" />
          <h4 className="font-semibold text-sm text-slate-100 uppercase tracking-wider">Secured Approval Signature</h4>
        </div>
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            type="button"
            onClick={() => setSignType('draw')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all ${
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
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all ${
              signType === 'type'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            Type Keyboard
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

      {signType === 'draw' ? (
        <div className="relative">
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
          <p className="text-[10px] text-slate-500 mt-1.5 italic text-center">
            Draw your signature directly using touch or cursor drag.
          </p>
        </div>
      ) : (
        <div>
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
                  ? 'font-serif italic tracking-widest'
                  : typedFont === 'serif'
                  ? 'font-serif underline tracking-tight'
                  : 'font-mono'
              }`}
            >
              {fullName || "Your Signature Preview"}
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-1.5 italic text-center">
            System will securely synthesize a digital typographic vector representation model.
          </p>
        </div>
      )}

      <div className="mt-5 flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={!fullName || !position}
          className="bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all cursor-pointer"
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
