import React, { useEffect, useRef } from 'react';
import { Instruction } from '../types';
import { StepForward, RotateCcw, FileTerminal, Undo2 } from 'lucide-react';

interface CodeEditorProps {
  code: string;
  onChange: (val: string) => void;
  instructions: Instruction[];
  executionLine: number | null;
  onStep: () => void;
  onStepBack: () => void;
  onReset: () => void;
  canStepBack: boolean;
  canStepForward: boolean;
  error: string | null;
  lastAction: string | null;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ 
  code, 
  onChange, 
  instructions, 
  executionLine, 
  onStep, 
  onStepBack,
  onReset,
  canStepBack,
  canStepForward,
  error,
  lastAction
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lines = code.split('\n');

  // Sync scroll of line numbers with textarea
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
      const lineNumElem = document.getElementById('line-numbers');
      if (lineNumElem) {
          lineNumElem.scrollTop = e.currentTarget.scrollTop;
      }
  };
  
  // Auto scroll to active line
  useEffect(() => {
      if (executionLine !== null && textareaRef.current) {
          // Rough calculation of line height (approx 24px)
          const lineHeight = 24;
          const scrollPos = (executionLine * lineHeight) - (textareaRef.current.clientHeight / 2);
          textareaRef.current.scrollTo({ top: Math.max(0, scrollPos), behavior: 'smooth' });
      }
  }, [executionLine]);

  return (
    <div className="h-full flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Toolbar */}
      <div className="p-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileTerminal size={18} className="text-gray-500" />
          <span className="font-semibold text-gray-700 text-sm">Assembly Source</span>
        </div>
        <div className="flex gap-2">
           <button 
            onClick={onReset}
            title="Reset Simulation"
            className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-md text-xs font-medium transition shadow-sm"
          >
            <RotateCcw size={14} /> <span className="hidden sm:inline">Reset</span>
          </button>
          
          <div className="h-6 w-px bg-gray-300 mx-1"></div>

          <button 
            onClick={onStepBack}
            disabled={!canStepBack}
            title="Step Back"
            className={`flex items-center gap-1 px-3 py-1.5 border rounded-md text-xs font-medium transition shadow-sm
                ${canStepBack 
                    ? 'bg-white border-gray-300 hover:bg-gray-50 text-gray-700' 
                    : 'bg-gray-50 border-gray-200 text-gray-300 cursor-not-allowed'}`}
          >
            <Undo2 size={14} /> <span className="hidden sm:inline">Back</span>
          </button>

          <button 
            onClick={onStep}
            disabled={!canStepForward}
            title="Execute Next Instruction"
            className={`flex items-center gap-1 px-4 py-1.5 rounded-md text-xs font-bold transition shadow-sm
                ${canStepForward 
                    ? 'bg-brand-600 hover:bg-brand-700 text-white shadow-brand-200' 
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
          >
            <StepForward size={14} fill="currentColor" /> Step
          </button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 relative flex overflow-hidden">
         {/* Line Numbers */}
         <div 
            id="line-numbers"
            className="w-12 bg-gray-50 border-r border-gray-200 text-right py-4 pr-2 text-gray-400 font-mono text-sm overflow-hidden select-none"
         >
            {lines.map((_, i) => (
                <div key={i} className="h-6 leading-6 relative flex justify-end">
                    {executionLine === i && (
                        <div className="absolute right-0 top-1 w-full h-4 bg-blue-100 -z-10"></div>
                    )}
                    {i + 1}
                </div>
            ))}
         </div>

         {/* Overlay for Highlighting (Behind Textarea) */}
         <div className="absolute top-0 left-12 right-0 bottom-0 pointer-events-none overflow-hidden py-4" id="highlight-overlay">
            <div 
                className="transition-transform duration-200 ease-out"
                style={{ transform: `translateY(-${textareaRef.current?.scrollTop || 0}px)` }}
            >
                 {lines.map((_, i) => (
                    <div key={i} className={`h-6 w-full ${executionLine === i ? 'bg-yellow-100 border-l-4 border-brand-500' : ''}`}></div>
                ))}
            </div>
         </div>

         {/* Text Input */}
         <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => onChange(e.target.value)}
            onScroll={handleScroll}
            className="flex-1 p-4 bg-transparent font-mono text-sm text-gray-800 outline-none resize-none leading-6 whitespace-pre z-10"
            spellCheck="false"
            autoCapitalize="none"
         />
      </div>

      {/* Status Bar */}
      <div className={`p-2 border-t text-xs font-mono flex items-center gap-2 ${error ? 'bg-red-50 border-red-100 text-red-600' : 'bg-white border-gray-100 text-gray-500'}`}>
         {error ? (
             <span className="font-bold">ERROR: {error}</span>
         ) : (
             <span className="truncate text-brand-600 font-medium">{lastAction || "Ready"}</span>
         )}
      </div>
    </div>
  );
};

export default CodeEditor;