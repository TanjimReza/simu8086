export enum Register {
  AX = 'AX',
  BX = 'BX',
  CX = 'CX',
  DX = 'DX',
  SP = 'SP',
  SS = 'SS',
}

export enum PipelineStage {
  FETCH = 'FETCH',
  EXECUTE_STAGE_1 = 'EXECUTE_STAGE_1', // e.g., PUSH: Decrement SP
  EXECUTE_STAGE_2 = 'EXECUTE_STAGE_2'  // e.g., PUSH: Store Value
}

export interface CpuState {
  pc: number; // Program Counter (Index in instruction array)
  pipeline: {
    stage: PipelineStage;
    tempValue?: number; // For holding values between stages if needed
  };
  registers: {
    [key in Register]: number;
  };
  prevRegisters: {
    [key in Register]: number;
  };
  memory: { [address: number]: number }; // Address -> Value (16-bit)
  stackStart: number; 
  flags: {
    zero: boolean;
    sign: boolean;
    overflow: boolean;
  };
  lastAction: string | null;
  error: string | null;
  highlightedMemory: number | null; // Address to highlight briefly
}

export enum OpCode {
  MOV = 'MOV',
  PUSH = 'PUSH',
  POP = 'POP',
  ADD = 'ADD',
  SUB = 'SUB',
  XCHG = 'XCHG',
  NOP = 'NOP'
}

export interface Instruction {
  id: string;
  op: OpCode;
  operand1?: string; 
  operand2?: string;
  originalLine: number; // For highlighting the editor
  raw: string;
}