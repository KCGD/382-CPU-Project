import { WriteStream } from "fs";
import { Instruction } from "./assembler";
import { BinToHex } from "./assemblerToools";

// use array shift to treat it like queue
//jump by block size
export function BuildRom(instructions:Instruction[], rom:WriteStream, size:number, blocksize: number): void {
    let block = -16;

    //write file header
    rom.write(`v3.0 hex words addressed`);

    for(let i=0; i <= size; i++) {
        if(i % blocksize === 0 || i === 0) {
            block += 16;
            rom.write(`\n${('0000' + block.toString(16).toUpperCase()).slice(-4)}:`);
        }

        let ins = instructions.shift();
        if(ins) {
            let instring = ins.mod + ins.op + ins.reg1 + ins.reg2 + ins.regw + ins.imm;
            rom.write(` ${BinToHex(instring)}`) 
        } else {
            rom.write(` 0000`);
        }
    }

    rom.close();
}