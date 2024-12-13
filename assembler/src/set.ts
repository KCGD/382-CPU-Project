export type opcode = "MOV" | "LDR" | "STR" | "ADD" | "SUB" | "B" | "BEQ" | "CMP";

interface codemap {[key: string]: string};

export const CodeMap:codemap = {
    "MOV": "000",
    "LDR": "001",
    "STR": "010",
    "ADD": "011",
    "SUB": "100",
    "B": "101",
    "BEQ": "110",
    "CMP": "111"
}