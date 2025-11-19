import React, { useEffect, useRef, useState } from 'react';
import { CpuState, Register } from '../types';
import { ArrowLeft, Database, MoveDown, MoveUp, ArrowUpFromLine } from 'lucide-react';

interface StackMemoryProps {
  state: CpuState;
}

type DisplayMode = 'HEX' | 'DEC' | 'ASCII';

const StackMemory: React.FC<StackMemoryProps> = ({ state }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [displayMode, setDisplayMode] = useState<DisplayMode>('HEX');
  
  const memoryAddresses: number[] = [];
  // Show a bit above the stack start and a reasonable amount below
  const topBound = state.stackStart + 4;
  const bottomBound = Math.max(0, state.stackStart - 0x50); // View window

  for (let i = bottomBound; i <= topBound; i += 2) {
    memoryAddresses.push(i);
  }
  // Sort descending so high addresses (Stack Base) are at top
  memoryAddresses.sort((a, b) => b - a);

  useEffect(() => {
    if (scrollContainerRef.current) {
      const activeElement = document.getElementById(`mem-${state.registers[Register.SP]}`);
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [state.registers[Register.SP]]);

  const formatAddr = (val: number) => val.toString(16).toUpperCase().padStart(4, '0');

  // Format Data based on selected mode
  const formatData = (val: number | undefined) => {
      if (val === undefined) return displayMode === 'ASCII' ? '..' : '0000';

      if (displayMode === 'DEC') {
          return val.toString();
      }
      if (displayMode === 'ASCII') {
          // Try to interpret high and low bytes
          const high = (val >> 8) & 0xFF;
          const low = val & 0xFF;
          
          const toChar = (c: number) => (c >= 32 && c <= 126) ? String.fromCharCode(c) : '.';
          
          // If high byte is 0, just show low byte char
          if (high === 0) return `.${toChar(low)}`;
          
          return `${toChar(high)}${toChar(low)}`;
      }
      // Default Hex
      return val.toString(16).toUpperCase().padStart(4, '0');
  };

  const sp = state.registers[Register.SP];
  const prevSp = state.prevRegisters[Register.SP];
  const ss = state.registers[Register.SS];
  const stackStart = state.stackStart;
  const spMovedDown = sp < prevSp; 
  const spMovedUp = sp > prevSp;   

  return (
    <div className="h-full flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
             <Database size={18} className="text-gray-500" />
             <div>
                <h2 className="font-semibold text-gray-700">Stack Segment</h2>
             </div>
        </div>
        
        <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-white rounded-md border border-gray-200 p-0.5">
                {(['HEX', 'DEC', 'ASCII'] as DisplayMode[]).map((mode) => (
                    <button
                        key={mode}
                        onClick={() => setDisplayMode(mode)}
                        className={`px-2 py-1 text-[10px] font-bold rounded-sm transition-colors ${
                            displayMode === mode 
                            ? 'bg-gray-100 text-brand-700' 
                            : 'text-gray-400 hover:text-gray-600'
                        }`}
                    >
                        {mode}
                    </button>
                ))}
            </div>

            <div className="text-right hidden sm:block">
                <div className="text-[10px] uppercase text-gray-400 font-bold">Base Address</div>
                <div className="font-mono text-xs text-gray-600 font-bold">SS: {formatAddr(ss)}H</div>
            </div>
        </div>
      </div>
      
      <div className="px-4 py-2 bg-gray-100/50 border-b border-gray-100 flex text-[10px] uppercase text-gray-400 font-bold tracking-wider">
         <div className="w-16">Offset</div>
         <div className="flex-1 text-center">
             Value <span className="text-gray-300 ml-1">({displayMode})</span>
         </div>
         <div className="w-24 text-right">Pointer</div>
      </div>

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto relative bg-white">
        {memoryAddresses.map((addr) => {
          const isSP = addr === sp;
          const isPrevSP = addr === prevSp && prevSp !== sp;
          const isStackBase = addr === stackStart;
          
          // Allocated: Everything strictly BELOW stack base and ABOVE OR EQUAL to SP
          // In stack growing down: StackBase > addr >= SP
          const isAllocated = addr < stackStart && addr >= sp;
          
          // Free Space: addr < SP
          const isFree = addr < sp;
          
          const isJustChanged = state.highlightedMemory === addr;
          
          // Dynamic Background Logic
          let rowBgClass = 'bg-white';
          if (isSP) rowBgClass = 'bg-amber-50';
          else if (isAllocated) rowBgClass = 'bg-brand-50/20'; // Subtle blue tint for stack content
          else if (isStackBase) rowBgClass = 'bg-gray-100';
          
          if (isJustChanged) rowBgClass = '!bg-blue-100 duration-75';

          return (
            <div 
              key={addr} 
              id={`mem-${addr}`}
              className={`
                flex items-center px-4 py-2 border-b border-gray-50 font-mono text-sm transition-colors duration-300
                ${rowBgClass}
              `}
            >
              {/* Address */}
              <div className="w-16 flex flex-col justify-center">
                <span className={`
                    ${isSP ? 'text-amber-600 font-bold' : ''}
                    ${!isSP && isAllocated ? 'text-brand-700 font-medium' : ''}
                    ${!isSP && !isAllocated && !isStackBase ? 'text-gray-400' : ''}
                    ${isStackBase ? 'text-gray-500 font-bold' : ''}
                `}>
                   {formatAddr(addr)}
                </span>
              </div>

              {/* Memory Cell */}
              <div className="flex-1 flex justify-center">
                 <div className={`
                    w-32 py-1 text-center border rounded transition-all relative
                    ${isSP ? 'border-amber-300 shadow-sm bg-white' : ''}
                    ${isAllocated && !isSP ? 'bg-brand-50 border-brand-200 text-brand-900' : ''}
                    ${isFree ? 'bg-gray-50/50 border-gray-100 text-gray-300' : ''}
                    ${isStackBase ? 'border-gray-300 bg-gray-200 text-gray-500 font-bold' : ''}
                 `}>
                    {state.memory[addr] !== undefined || isStackBase ? formatData(state.memory[addr]) : (displayMode === 'ASCII' ? '..' : '0000')}
                    
                    {/* Movement Visuals */}
                    {isSP && spMovedDown && prevSp === addr + 2 && (
                        <div className="absolute -right-8 top-1 text-xs text-green-600 font-bold flex items-center animate-bounce">
                            <MoveDown size={12} /> -2
                        </div>
                    )}
                    {isPrevSP && spMovedUp && sp === addr + 2 && (
                        <div className="absolute -right-8 top-1 text-xs text-red-400 font-bold flex items-center opacity-50">
                            <MoveUp size={12} /> +2
                        </div>
                    )}
                 </div>
              </div>

              {/* Pointer */}
              <div className="w-24 flex justify-end items-center relative gap-2">
                {isSP && (
                   <div className="flex items-center text-amber-600 font-bold text-xs animate-in slide-in-from-right-2 duration-300">
                     <ArrowLeft size={16} />
                     <span className="ml-1">SP</span>
                   </div>
                )}
                
                {isPrevSP && (
                   <div className="flex items-center text-gray-300 font-bold text-xs opacity-60">
                     <span className="mr-1">Was SP</span>
                   </div>
                )}

                {isStackBase && !isSP && (
                    <div className="flex items-center text-gray-400 font-bold text-[10px] gap-1">
                         <ArrowUpFromLine size={14} />
                        BASE
                    </div>
                )}
              </div>
            </div>
          );
        })}
        
        <div className="p-4 text-center text-xs text-gray-300 italic mt-4">
            End of Segment View
        </div>
      </div>
    </div>
  );
};

export default StackMemory;