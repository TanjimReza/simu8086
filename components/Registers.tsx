import React, { useState } from 'react';
import { CpuState, Register } from '../types';
import { Cpu, Hash, SplitSquareHorizontal, Combine } from 'lucide-react';

interface RegistersProps {
  state: CpuState;
}

const RegisterRow = ({ 
    label, 
    value, 
    prevValue, 
    isPointer = false, 
    isSplit = false 
}: { 
    label: string, 
    value: number, 
    prevValue: number, 
    isPointer?: boolean,
    isSplit?: boolean
}) => {
  const hasChanged = value !== prevValue;
  
  // Split logic
  const high = (value >> 8) & 0xFF;
  const low = value & 0xFF;
  const prevHigh = (prevValue >> 8) & 0xFF;
  const prevLow = prevValue & 0xFF;

  const labelHigh = label.charAt(0) + 'H';
  const labelLow = label.charAt(0) + 'L';

  // Base Styles
  const containerClass = `flex flex-col p-2 rounded-md border transition-colors duration-300 ${
    isPointer 
        ? (hasChanged ? 'bg-amber-100 border-amber-300' : 'bg-amber-50 border-amber-200') 
        : (hasChanged ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200')
  }`;

  if (isSplit && !isPointer) {
      return (
        <div className={containerClass}>
            <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-brand-700 text-xs">{label} (Split)</span>
            </div>
            <div className="flex gap-2">
                {/* High Byte */}
                <div className="flex-1 flex flex-col items-center bg-white/50 p-1 rounded border border-gray-200/50">
                    <span className="text-[10px] font-bold text-gray-500">{labelHigh}</span>
                    <span className={`font-mono font-bold ${high !== prevHigh ? 'text-blue-600' : 'text-gray-800'}`}>
                        {high.toString(16).toUpperCase().padStart(2, '0')}H
                    </span>
                    <span className="text-[9px] text-gray-400">{high}</span>
                </div>
                {/* Low Byte */}
                <div className="flex-1 flex flex-col items-center bg-white/50 p-1 rounded border border-gray-200/50">
                    <span className="text-[10px] font-bold text-gray-500">{labelLow}</span>
                    <span className={`font-mono font-bold ${low !== prevLow ? 'text-blue-600' : 'text-gray-800'}`}>
                        {low.toString(16).toUpperCase().padStart(2, '0')}H
                    </span>
                    <span className="text-[9px] text-gray-400">{low}</span>
                </div>
            </div>
        </div>
      );
  }

  return (
    <div className={`flex items-center justify-between p-2 rounded-md border transition-colors duration-300 ${
        isPointer 
            ? (hasChanged ? 'bg-amber-100 border-amber-300' : 'bg-amber-50 border-amber-200') 
            : (hasChanged ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200')
    }`}>
      <div className="flex flex-col">
        <span className={`font-mono font-bold ${isPointer ? 'text-amber-700' : 'text-brand-700'}`}>{label}</span>
      </div>
      <div className="flex flex-col items-end font-mono">
          <div className="flex gap-3 text-sm">
            <span className="text-gray-400">{value.toString().padStart(5, '0')}D</span>
            <span className={`font-bold ${isPointer ? 'text-amber-900' : 'text-gray-900'}`}>
                {value.toString(16).toUpperCase().padStart(4, '0')}H
            </span>
          </div>
          {hasChanged && (
              <div className="text-[10px] text-gray-500">
                  Was: {prevValue.toString(16).toUpperCase().padStart(4, '0')}H
              </div>
          )}
      </div>
    </div>
  );
};

const Registers: React.FC<RegistersProps> = ({ state }) => {
  const [splitView, setSplitView] = useState(false);

  return (
    <div className="h-full flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
            <Cpu size={18} className="text-gray-500" />
            <h2 className="font-semibold text-gray-700">Registers</h2>
        </div>
        
        <button 
            onClick={() => setSplitView(!splitView)}
            title={splitView ? "Merge to 16-bit" : "Split to 8-bit"}
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-white border border-gray-200 text-[10px] font-bold text-gray-500 hover:text-brand-600 hover:border-brand-200 transition"
        >
            {splitView ? <Combine size={12}/> : <SplitSquareHorizontal size={12} />}
            {splitView ? "16-BIT" : "8-BIT"}
        </button>
      </div>

      <div className="p-4 space-y-6 flex-1 overflow-y-auto">
        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-1">
            <Hash size={12} /> General Purpose
          </h3>
          <div className="grid grid-cols-1 gap-2">
            <RegisterRow label="AX" value={state.registers[Register.AX]} prevValue={state.prevRegisters[Register.AX]} isSplit={splitView} />
            <RegisterRow label="BX" value={state.registers[Register.BX]} prevValue={state.prevRegisters[Register.BX]} isSplit={splitView} />
            <RegisterRow label="CX" value={state.registers[Register.CX]} prevValue={state.prevRegisters[Register.CX]} isSplit={splitView} />
            <RegisterRow label="DX" value={state.registers[Register.DX]} prevValue={state.prevRegisters[Register.DX]} isSplit={splitView} />
          </div>
        </div>

        <div>
           <h3 className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-1">
            <Hash size={12} /> Pointers
          </h3>
          <div className="grid grid-cols-1 gap-2">
            <RegisterRow label="SS" value={state.registers[Register.SS]} prevValue={state.prevRegisters[Register.SS]} isPointer />
            <RegisterRow label="SP" value={state.registers[Register.SP]} prevValue={state.prevRegisters[Register.SP]} isPointer />
          </div>
        </div>

        <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
            <div className="text-xs text-gray-500 mb-1 uppercase font-bold">Status Flags</div>
            <div className="flex gap-2">
                <span className={`px-2 py-1 rounded text-xs font-bold border transition-colors ${state.flags.zero ? 'bg-green-100 text-green-700 border-green-200' : 'bg-white text-gray-300 border-gray-200'}`}>ZF (Zero)</span>
                <span className={`px-2 py-1 rounded text-xs font-bold border transition-colors ${state.flags.sign ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-white text-gray-300 border-gray-200'}`}>SF (Sign)</span>
                <span className={`px-2 py-1 rounded text-xs font-bold border transition-colors ${state.flags.overflow ? 'bg-red-100 text-red-700 border-red-200' : 'bg-white text-gray-300 border-gray-200'}`}>OF (Overflow)</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Registers;