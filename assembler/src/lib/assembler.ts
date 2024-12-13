import { CodeMap } from "../set";
import { DecToBin, RegToBin } from "./assemblerToools";
import { textInstruction } from "./parsingTools";
import { Table } from "./table";

export type Instruction = {
    mod: string;
    op: string;
    reg1: string;
    reg2: string;
    regw: string;
    imm: string;
}

type qBranch = {
    instructionAddress: number;
    label: string;
}

export class Assembler {
    address:number;
    adrTable:Table<number>;
    branchProcessingQueue:qBranch[] = new Array<qBranch>;   

    constructor() {
        this.address = 0;
        this.adrTable = new Table<number>();
    }

    //defer branch offset processing
    calculateBranchOffsets(instructions:Instruction[]): Instruction[] {
        for(let i=0; i < this.branchProcessingQueue.length; i++) {
            let branch = this.branchProcessingQueue[i];
            let label = branch.label;
            let address = branch.instructionAddress;

            // check if label exists
            if(!this.adrTable.has(label) || this.adrTable.get(label) === null) {
                throw `Undefined label "${label}" at address ${this.address}.`;
            }

            // ts compiler being dumb and not realizing that i nullchecked this
            //@ts-ignore
            let offset = this.adrTable.get(label) - address;

            // check if offset in bounds
            if(Math.abs(offset) > 7) {
                throw `Illegal branch (offset greater than 7) at address ${address}.`;
            }

            // branching backwards, mod is 1
            // redefine mod bit
            if(offset < 0) {
                instructions[address].mod = "1";
            } else {
                instructions[address].mod = "0";
            }

            //immidiate (offset)
            instructions[address].imm = DecToBin(Math.abs(offset));
        }

        return instructions;
    }

    //AVENGERS!
    assemble(instruction:textInstruction): Instruction | null {
        // bin format: mod[0] - opcode[1-3] - reg1[4-6] - reg2[7-9] - writeReg[10-12] - imm[13-15]
        // if last position is reg, mod,imm=0, use reg1 reg2 writeReg 000
        // if last position is imm, mod=1, use reg1 000 writeReg imm

        /**
         * Assemble instruction
         */
        if(instruction.type === "instruction") {
            let binInstruction:Instruction = {} as Instruction;

            //mod bit
            (instruction.data[3] && instruction.data[3][0].toLowerCase() === "x") ? binInstruction.mod = "0" : binInstruction.mod = "1";

            //opcode
            let opcode = instruction.data[0];
            if(!(opcode in CodeMap)) {
                throw `Undefined instruction ${opcode} at address ${this.address}.`;
            } else {
                binInstruction.op = CodeMap[opcode];
            }

            //special case for compairisons and MOV (two param instruction)
            if(opcode === "CMP" || opcode === "MOV") {
                if(instruction.data[2][0].toLowerCase() === "x") {
                    // comparing registers reg1 reg2. regw = reg1 (mov. cmp will not write)
                    binInstruction.mod = "0";
                    binInstruction.reg1 = RegToBin(instruction.data[1]);
                    binInstruction.reg2 = RegToBin(instruction.data[2]);
                    binInstruction.regw = RegToBin(instruction.data[1]);
                    binInstruction.imm = "000";
                } else {
                    // compare reg to immidiate. reg1 vs imm, reg2 and regw zero
                    let imm = parseInt(instruction.data[2]);
                    if(imm > 7 || imm < 0) {
                        throw `Illegal immidiate value ${imm} at address ${this.address}.`;
                    }

                    binInstruction.mod = "1";
                    binInstruction.reg1 = RegToBin(instruction.data[1]);
                    binInstruction.reg2 = "000";
                    binInstruction.regw = RegToBin(instruction.data[1]);
                    binInstruction.imm = DecToBin(imm);
                }
            }

            //special case for branching
             else if(opcode === "B" || opcode === "BEQ") {
                // reg1 spot is label in this case
                // calculate difference in current address and label in adrTable
                // negative = mod 1
                // check value if more than seven
                // if good, place difference in immidiate position
                let label:string = instruction.data[1];

                //enqueue branch for processing after-assembling
                this.branchProcessingQueue.push({'instructionAddress': this.address, 'label': label});

                //reg1
                binInstruction.reg1 = "000";
                //reg2
                binInstruction.reg2 = "000";
                //writeReg
                binInstruction.regw = "000";

                binInstruction.imm = "000";
            }

            // mod 0, using all registers, zero immidiate
            else if(binInstruction.mod === "0") {
                //Reg1
                try {
                    binInstruction.reg1 = (RegToBin(instruction.data[2]));
                } catch (e) {
                    throw `${e} at address ${this.address}.`;
                }

                //Reg2
                try {
                    binInstruction.reg2 = (RegToBin(instruction.data[3]));
                } catch (e) {
                    throw `${e} at address ${this.address}.`;
                }

                //WriteReg
                try {
                    binInstruction.regw = (RegToBin(instruction.data[1]));
                } catch (e) {
                    throw `${e} at address ${this.address}.`;
                }

                // immidiate (unused)
                binInstruction.imm = "000";

            /**
             * Using immidiate value, zero reg2, writeReg as reg2, keep imm
             */
            } else {
                //Reg1
                try {
                    binInstruction.reg1 = (RegToBin(instruction.data[2]));
                } catch (e) {
                    throw `${e} at address ${this.address}.`;
                }

                //Reg2 (unused)
                binInstruction.reg2 = "000";

                //WriteReg
                try {
                    binInstruction.regw = (RegToBin(instruction.data[1]));
                } catch (e) {
                    throw `${e} (writereg) at address ${this.address}.`;
                }

                //immidiate
                let imm = parseInt(instruction.data[3]);
                if(isNaN(imm)) {throw `Invalid immidiate value ${instruction.data[3]} at address ${this.address}.`};

                if(imm > 7 || imm < 0) {
                    throw `Illegal immidiate value ${imm} (must be between 0 and 7) at address ${this.address}.`;
                }
                binInstruction.imm = DecToBin(imm);
            }

            //incrememnt address
            this.address++;

            //return binary instruction
            return binInstruction;

        /**
         * Assemble label, returns no instruction
         */
        } else if (instruction.type === "label") {
            if(!this.adrTable.has(instruction.data[0])) {
                this.adrTable.set(instruction.data[0], this.address);
            } else {
                throw `Duplicate label "${instruction.data}" at address ${this.address}.`;
            }

            return null;
        } else {
            //???
            return null;
        }
    }
}