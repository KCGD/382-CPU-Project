/**
 * Name / Author: Benicio Hernandez
 * Pledge: I pledge my honor that I have abided by the Stevens Honor System.
 */

import { createReadStream, createWriteStream, existsSync } from "fs";
import { createInterface } from "readline";
import { ParseLine, textInstruction } from "./lib/parsingTools";
import { Table } from "./lib/table";
import { Assembler, Instruction } from "./lib/assembler";
import { BuildRom } from "./lib/rom";

require('source-map-support').install();
Main(process.argv.length, process.argv);

function printUsage(entree:string): void {
    console.error(`Usage: node ${entree} <input.s> <output.rom>`);
}

function Main(argc:number, argv:string[]): void {
    // line format: line<hex16>: "instruction<hex16>" " " ... (x16)
    // line number goes up by 16 each time
    // label format (if line ends with :, trim up to and store address), dont increment address

    if(argc-2 != 2) {
        printUsage(argv[1]);
        process.exit(1);
    }

    const infile = argv[2];
    const outfile = argv[3];
    let textInstructions:textInstruction[] = new Array<textInstruction>;
    let binInstructions:Instruction[] = new Array<Instruction>;

    // check for file
    if(!existsSync(infile)) {
        console.error(`Could not find: ${infile}`);
        process.exit(1);
    }

    // start reading infile
    let readStream = createReadStream(infile);
    let outStream = createWriteStream(outfile);

    //create instance of assembler
    let assembler = new Assembler();

    const rl = createInterface({
        input: readStream
    })

    //read lines from assembly file
    rl.on('line', (line) => {
        let parsedLine = ParseLine(line);
        if(parsedLine) {
            textInstructions.push(parsedLine);
            let binInstruct: Instruction | null;

            try {
                binInstruct = assembler.assemble(parsedLine);
            } catch (e) {
                console.error(`ERROR: ${e}`);
                readStream.close();
                outStream.close();
                process.exit(1);
            }

            if(binInstruct) {
                binInstructions.push(binInstruct);
            }
        }
    })

    //file ended
    rl.on('close', () => {
        //close streams
        readStream.close();
        
        //calculate branching offsets
        try {
            binInstructions = assembler.calculateBranchOffsets(binInstructions);   
        } catch (e) {
            console.error(`ERROR: ${e}`);
            outStream.close();
            process.exit(1);
        }

        BuildRom(binInstructions, outStream, 65520, 16);
    })
}