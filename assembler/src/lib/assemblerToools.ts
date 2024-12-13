export function BinToHex(bin:string): string {
    return parseInt(bin, 2).toString(16);
}

export function DecToBin(dec:number): string {
    return padZero((dec >>> 0).toString(2), 3);
}

export function RegToBin(reg:string): string {
    if(reg[0].toLowerCase() !== "x") {
        throw "Not a register";
    }

    let regnumber:number = parseInt(reg.substring(1));
    if(isNaN(regnumber)) {
        throw `Invalid register identifyer "${reg}"`;
    }

    return padZero(DecToBin(regnumber), 3);
}

function padZero(str:string, length:number) {
    let diff = length-str.length;
    let pad = "";
    for(let i=0; i < diff; i++) {
        pad += '0';
    }

    return pad + str;
}