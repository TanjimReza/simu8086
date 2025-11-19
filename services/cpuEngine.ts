import { CpuState, Instruction, OpCode, PipelineStage, Register } from '../types';

export const createInitialState = (stackSize: number = 0x100): CpuState => {
  const regs = {
    [Register.AX]: 0x0000,
    [Register.BX]: 0x0000,
    [Register.CX]: 0x0000,
    [Register.DX]: 0x0000,
    [Register.SS]: 0x1000, 
    [Register.SP]: stackSize,
  };

  return {
    pc: 0,
    pipeline: { stage: PipelineStage.FETCH },
    registers: regs,
    prevRegisters: regs,
    memory: {},
    stackStart: stackSize,
    flags: { zero: false, sign: false, overflow: false },
    lastAction: "System Ready",
    error: null,
    highlightedMemory: null
  };
};

// --- PARSER ---

export const parseSourceCode = (source: string): Instruction[] => {
  const lines = source.split('\n');
  const instructions: Instruction[] = [];

  lines.forEach((line, index) => {
    // Remove comments and trim
    const cleanLine = line.split(';')[0].trim();
    if (!cleanLine) return;

    // Split by space or comma, filter out empty strings
    const parts = cleanLine.split(/[ ,]+/).filter(p => p !== '');
    if (parts.length === 0) return;

    const opRaw = parts[0].toUpperCase();
    let op = OpCode.NOP;
    
    if (Object.values(OpCode).includes(opRaw as OpCode)) {
      op = opRaw as OpCode;
    }

    instructions.push({
      id: `inst-${index}-${Math.random()}`,
      op,
      operand1: parts[1], 
      operand2: parts[2],
      originalLine: index,
      raw: cleanLine
    });
  });

  return instructions;
};

// --- HELPERS ---

const setRegisterValue = (state: CpuState, reg: Register, val: number): CpuState => {
  return {
    ...state,
    registers: {
      ...state.registers,
      [reg]: val & 0xFFFF, 
    },
  };
};

const parseOperand = (state: CpuState, operand: string | undefined): number => {
  if (!operand) return 0;
  
  const upperOp = operand.toUpperCase();
  
  // Register access
  if (Object.values(Register).includes(upperOp as Register)) {
    return state.registers[upperOp as Register];
  }
  
  // Hex literal
  if (upperOp.endsWith('H')) {
    return parseInt(upperOp.slice(0, -1), 16);
  }
  
  // Decimal literal
  const parsed = parseInt(operand, 10);
  if (!isNaN(parsed)) return parsed;
  
  // Attempt basic parsing if it's just a number string
  return parseInt(operand);
};

// --- CORE ENGINE ---

export const stepCpu = (state: CpuState, instructions: Instruction[]): CpuState => {
  // 1. Check boundaries
  if (state.pc >= instructions.length) {
    return { ...state, lastAction: "End of program" };
  }

  const inst = instructions[state.pc];

  // Prepare base new state (clear transient flags)
  let newState: CpuState = {
    ...state,
    prevRegisters: { ...state.registers }, // Snapshot for diffing
    lastAction: "",
    error: null,
    highlightedMemory: null
  };

  try {
    // --- PIPELINE HANDLING ---
    
    // CASE 1: PUSH (Split into 2 stages)
    if (inst.op === OpCode.PUSH) {
      if (!inst.operand1) throw new Error("PUSH requires operand");

      // Stage 1: Decrement SP
      if (state.pipeline.stage === PipelineStage.FETCH) {
         const currentSP = newState.registers[Register.SP];
         const newSP = currentSP - 2;
         
         if (newSP < 0) throw new Error("Stack Overflow");

         newState = {
             ...newState,
             registers: { ...newState.registers, [Register.SP]: newSP },
             pipeline: { stage: PipelineStage.EXECUTE_STAGE_2 }, // Go to next stage next click
             lastAction: "PUSH (Step 1/2): Decrement SP by 2",
             // Do NOT increment PC yet
         };
         return newState;
      }
      
      // Stage 2: Store Value
      if (state.pipeline.stage === PipelineStage.EXECUTE_STAGE_2) {
         const srcVal = parseOperand(state, inst.operand1);
         const currentSP = newState.registers[Register.SP]; // SP is already decremented

         newState = {
             ...newState,
             memory: { ...newState.memory, [currentSP]: srcVal & 0xFFFF },
             highlightedMemory: currentSP,
             pipeline: { stage: PipelineStage.FETCH }, // Done
             pc: state.pc + 1, // Next instruction
             lastAction: `PUSH (Step 2/2): Store ${srcVal.toString(16).toUpperCase()}H at top`,
         };
         return newState;
      }
    }

    // CASE 2: POP (Split into 2 stages)
    else if (inst.op === OpCode.POP) {
        if (!inst.operand1) throw new Error("POP requires operand");

        // Stage 1: Read Value & Update Destination
        if (state.pipeline.stage === PipelineStage.FETCH) {
            const currentSP = newState.registers[Register.SP];
            if (currentSP >= state.stackStart) throw new Error("Stack Underflow");
            
            const val = newState.memory[currentSP] || 0;
            const dest = inst.operand1.toUpperCase() as Register;
            
            newState = setRegisterValue(newState, dest, val);
            newState = {
                ...newState,
                highlightedMemory: currentSP,
                pipeline: { stage: PipelineStage.EXECUTE_STAGE_2 },
                lastAction: `POP (Step 1/2): Copy data from Stack to ${dest}`,
                // Do NOT increment PC
            };
            return newState;
        }

        // Stage 2: Increment SP
        if (state.pipeline.stage === PipelineStage.EXECUTE_STAGE_2) {
            const currentSP = newState.registers[Register.SP];
            const newSP = currentSP + 2;
            
            newState = {
                ...newState,
                registers: { ...newState.registers, [Register.SP]: newSP },
                pipeline: { stage: PipelineStage.FETCH },
                pc: state.pc + 1,
                lastAction: "POP (Step 2/2): Increment SP by 2",
            };
            return newState;
        }
    }

    // CASE 3: ATOMIC INSTRUCTIONS (MOV, ADD, SUB, etc.)
    // These run in one cycle for this simulator's simplicity, though arguably could be split too.
    else {
        switch (inst.op) {
            case OpCode.MOV: {
                const val = parseOperand(state, inst.operand2);
                const dest = inst.operand1?.toUpperCase() as Register;
                newState = setRegisterValue(newState, dest, val);
                newState.lastAction = `MOV: ${dest} <- ${val.toString(16).toUpperCase()}H`;
                break;
            }
            case OpCode.ADD: {
                const dest = inst.operand1?.toUpperCase() as Register;
                const val = parseOperand(state, inst.operand2);
                const res = (newState.registers[dest] + val) & 0xFFFF;
                newState = setRegisterValue(newState, dest, res);
                newState.lastAction = `ADD: ${dest} + ${val} = ${res}`;
                break;
            }
            case OpCode.SUB: {
                const dest = inst.operand1?.toUpperCase() as Register;
                const val = parseOperand(state, inst.operand2);
                const res = (newState.registers[dest] - val) & 0xFFFF;
                newState = setRegisterValue(newState, dest, res);
                newState.lastAction = `SUB: ${dest} - ${val} = ${res}`;
                break;
            }
            case OpCode.XCHG: {
                const r1 = inst.operand1?.toUpperCase() as Register;
                const r2 = inst.operand2?.toUpperCase() as Register;
                const v1 = newState.registers[r1];
                const v2 = newState.registers[r2];
                newState = setRegisterValue(newState, r1, v2);
                newState = setRegisterValue(newState, r2, v1);
                newState.lastAction = `XCHG: ${r1} <-> ${r2}`;
                break;
            }
            default:
                newState.lastAction = `Executed ${inst.op}`;
                break;
        }

        // Complete atomic instruction
        newState.pipeline.stage = PipelineStage.FETCH;
        newState.pc = state.pc + 1;
        return newState;
    }

  } catch (e: any) {
    return { ...state, error: e.message };
  }
  
  return state; // Fallback
};