import React, { useState } from 'react';
import { BookOpen, Box, RefreshCw, Settings, GraduationCap, Code2 } from 'lucide-react';

interface SidebarProps {
    onLoadPreset: (code: string) => void;
    onSetStackSize: (size: number) => void;
    currentStackSize: number;
}

const PRESETS = {
    SWAP: `; Swap two numbers using Stack
MOV AX, 1234H
MOV BX, 5678H
; Push onto stack
PUSH AX
PUSH BX
; Pop in reverse order to swap
POP AX
POP BX`,
    
    REVERSE: `; Reverse 3 numbers
MOV AX, 1
MOV BX, 2
MOV CX, 3
PUSH AX
PUSH BX
PUSH CX
POP AX
POP BX
POP CX`,

    ASCII: `; String Logic (ASCII)
; Pushing 'AB' and 'CD'
MOV AX, 4142H ; 'AB'
PUSH AX
MOV AX, 4344H ; 'CD'
PUSH AX
POP BX
POP DX`,

    LAB_DEMO: `; Lab 07 Demo
MOV AX, 122
PUSH AX
MOV AX, 49
PUSH AX
POP BX
MOV DX, BX
POP BX
MOV DX, BX`
};

type Tab = 'LABS' | 'DOCS';

const Sidebar: React.FC<SidebarProps> = ({ onLoadPreset, onSetStackSize, currentStackSize }) => {
    const [activeTab, setActiveTab] = useState<Tab>('LABS');

    return (
        <aside className="w-64 bg-white border-r border-gray-200 hidden lg:flex flex-col">
            <div className="p-6 border-b border-gray-100">
                <div className="flex items-center gap-2 text-brand-700 font-bold text-xl">
                    <Box className="fill-brand-100" />
                    <span>StackSim</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Intel 8086 Lab Visualizer</p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100">
                <button 
                    onClick={() => setActiveTab('LABS')}
                    className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'LABS' ? 'border-brand-500 text-brand-600 bg-brand-50/50' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                >
                    <GraduationCap size={14} /> Exercises
                </button>
                <button 
                     onClick={() => setActiveTab('DOCS')}
                    className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'DOCS' ? 'border-brand-500 text-brand-600 bg-brand-50/50' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                >
                    <Code2 size={14} /> Reference
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                
                {activeTab === 'LABS' && (
                    <>
                        {/* Presets */}
                        <div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 tracking-wider">Lab Presets</h3>
                            <div className="space-y-1">
                                <button 
                                    onClick={() => onLoadPreset(PRESETS.SWAP)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 rounded hover:bg-gray-50 hover:text-brand-600 transition"
                                >
                                    <RefreshCw size={16} /> Swap Operation
                                </button>
                                <button 
                                     onClick={() => onLoadPreset(PRESETS.REVERSE)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 rounded hover:bg-gray-50 hover:text-brand-600 transition"
                                >
                                    <RefreshCw size={16} /> Reverse Array
                                </button>
                                 <button 
                                     onClick={() => onLoadPreset(PRESETS.ASCII)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 rounded hover:bg-gray-50 hover:text-brand-600 transition"
                                >
                                    <Code2 size={16} /> ASCII Demo
                                </button>
                                <button 
                                     onClick={() => onLoadPreset(PRESETS.LAB_DEMO)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 rounded hover:bg-gray-50 hover:text-brand-600 transition"
                                >
                                    <BookOpen size={16} /> Lab Manual Ex.
                                </button>
                            </div>
                        </div>

                        {/* Configuration */}
                        <div>
                             <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 tracking-wider flex items-center gap-2">
                                <Settings size={12} /> Configuration
                             </h3>
                             <div className="px-3 py-2 bg-gray-50 rounded border border-gray-100 space-y-2">
                                <label className="text-xs text-gray-500 font-semibold block">Stack Size (SP Start)</label>
                                <select 
                                    value={currentStackSize}
                                    onChange={(e) => onSetStackSize(parseInt(e.target.value))}
                                    className="w-full text-xs p-2 border border-gray-200 rounded bg-white focus:border-brand-500 outline-none"
                                >
                                    <option value="256">100H (256 Bytes)</option>
                                    <option value="512">200H (512 Bytes)</option>
                                    <option value="1024">400H (1 KB)</option>
                                </select>
                             </div>
                        </div>

                        <div>
                             <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 tracking-wider">Visual Guide</h3>
                             <div className="text-xs text-gray-500 leading-relaxed p-3 bg-gray-50 rounded border border-gray-100 space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                                    <span>SP (Active Pointer)</span>
                                </div>
                                 <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 border border-gray-400 rounded-full"></div>
                                    <span>Ghost (Previous SP)</span>
                                </div>
                             </div>
                        </div>
                    </>
                )}

                {activeTab === 'DOCS' && (
                     <div className="space-y-4">
                        <div className="p-3 bg-blue-50 border border-blue-100 rounded-md">
                            <h4 className="font-bold text-blue-800 text-xs mb-1">MOV dest, src</h4>
                            <p className="text-xs text-blue-700 mb-2">Copies data from source to destination.</p>
                            <code className="block bg-white/50 p-1 rounded text-[10px] font-mono text-blue-900">
                                MOV AX, 1234H<br/>
                                MOV BX, AX
                            </code>
                        </div>

                        <div className="p-3 bg-amber-50 border border-amber-100 rounded-md">
                            <h4 className="font-bold text-amber-800 text-xs mb-1">PUSH src</h4>
                            <p className="text-xs text-amber-700 mb-2">
                                1. Decrement SP by 2.<br/>
                                2. Copy <b>src</b> to Stack [SP].
                            </p>
                            <code className="block bg-white/50 p-1 rounded text-[10px] font-mono text-amber-900">
                                PUSH AX<br/>
                                PUSH 1234H
                            </code>
                        </div>

                        <div className="p-3 bg-amber-50 border border-amber-100 rounded-md">
                            <h4 className="font-bold text-amber-800 text-xs mb-1">POP dest</h4>
                            <p className="text-xs text-amber-700 mb-2">
                                1. Copy data from Stack [SP] to <b>dest</b>.<br/>
                                2. Increment SP by 2.
                            </p>
                            <code className="block bg-white/50 p-1 rounded text-[10px] font-mono text-amber-900">
                                POP BX<br/>
                                POP DX
                            </code>
                        </div>

                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                            <h4 className="font-bold text-gray-800 text-xs mb-1">XCHG op1, op2</h4>
                            <p className="text-xs text-gray-600 mb-2">Swaps the contents of two registers.</p>
                            <code className="block bg-white/50 p-1 rounded text-[10px] font-mono text-gray-700">
                                XCHG AX, BX
                            </code>
                        </div>
                     </div>
                )}

            </div>
            
            <div className="mt-auto p-4 border-t border-gray-100">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span>System Ready</span>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;