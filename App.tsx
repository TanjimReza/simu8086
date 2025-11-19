import React, { useState, useEffect, useCallback } from 'react';
import { CpuState, Instruction } from './types';
import { createInitialState, stepCpu, parseSourceCode } from './services/cpuEngine';
import Registers from './components/Registers';
import StackMemory from './components/StackMemory';
import CodeEditor from './components/CodeEditor';
import Sidebar from './components/Sidebar';
import { Menu } from 'lucide-react';

const DEFAULT_CODE = `; Lab 07 Demo
MOV AX, 122D
PUSH AX
MOV AX, 49D
PUSH AX

POP BX
MOV DX, BX
POP BX 
MOV DX, BX`;

function App() {
  const [sourceCode, setSourceCode] = useState(DEFAULT_CODE);
  const [stackSize, setStackSize] = useState(0x100); 
  
  // History Management
  const [history, setHistory] = useState<CpuState[]>([createInitialState(0x100)]);
  const [historyIndex, setHistoryIndex] = useState(0);
  
  const [instructions, setInstructions] = useState<Instruction[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const currentState = history[historyIndex];

  // Compile source code when it changes
  useEffect(() => {
    const compiled = parseSourceCode(sourceCode);
    setInstructions(compiled);
  }, [sourceCode]);

  // Reset CPU when stack size changes
  useEffect(() => {
    handleReset();
  }, [stackSize]);

  const handleStepForward = useCallback(() => {
    // If we are not at the end of history, just move forward
    if (historyIndex < history.length - 1) {
        setHistoryIndex(prev => prev + 1);
        return;
    }

    // If we are at the end, calculate next state
    if (currentState.pc >= instructions.length) return;

    const nextState = stepCpu(currentState, instructions);
    
    // If error, don't advance state logic, but maybe we show error
    // Ideally stepCpu returns state with error field set
    const newHistory = [...history, nextState];
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);

  }, [currentState, instructions, history, historyIndex]);

  const handleStepBack = useCallback(() => {
    if (historyIndex > 0) {
        setHistoryIndex(prev => prev - 1);
    }
  }, [historyIndex]);

  const handleReset = () => {
    const newState = createInitialState(stackSize);
    setHistory([newState]);
    setHistoryIndex(0);
  };

  // Identify the active line for the editor
  // If execution is finished, no line is active
  // Otherwise, find the instruction at the current PC
  const activeInstruction = instructions[currentState.pc];
  const activeLine = activeInstruction ? activeInstruction.originalLine : null;

  return (
    <div className="flex h-screen w-full bg-gray-50 font-sans text-gray-900 overflow-hidden">
      
      {/* Desktop Sidebar */}
      <Sidebar 
        onLoadPreset={(code) => {
          setSourceCode(code);
          setTimeout(handleReset, 0);
        }} 
        onSetStackSize={setStackSize}
        currentStackSize={stackSize}
      />

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 flex items-center px-4 z-20 justify-between">
          <span className="font-bold text-brand-700">Simu8086</span>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-gray-600">
              <Menu />
          </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full pt-14 lg:pt-0">
          <div className="flex-1 p-4 lg:p-6 overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full max-w-[1920px] mx-auto">
                  
                  {/* Code Editor Column */}
                  <div className="lg:col-span-5 h-[50vh] lg:h-full flex flex-col">
                      <CodeEditor 
                          code={sourceCode}
                          onChange={setSourceCode}
                          instructions={instructions}
                          executionLine={activeLine}
                          onStep={handleStepForward}
                          onStepBack={handleStepBack}
                          onReset={handleReset}
                          canStepBack={historyIndex > 0}
                          canStepForward={currentState.pc < instructions.length || historyIndex < history.length - 1}
                          error={currentState.error}
                          lastAction={currentState.lastAction}
                      />
                  </div>

                  {/* Visualization Column */}
                  <div className="lg:col-span-4 h-[40vh] lg:h-full">
                      <StackMemory state={currentState} />
                  </div>

                  {/* Registers Column */}
                  <div className="lg:col-span-3 h-auto lg:h-full">
                      <Registers state={currentState} />
                  </div>

              </div>
          </div>
      </main>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
          <div className="fixed inset-0 bg-gray-900/50 z-10 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}
    </div>
  );
}

export default App;