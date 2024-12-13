export type textInstruction = {
    type: "label" | "instruction";
    data: string[];
}

//returns undefined if line is empty
export function ParseLine(line:string): textInstruction | null {
    let data:string[] = [];
    let buffer:string[] = [];
    let isValid:boolean = true;

    line = line.trim();

    for(let i=0; i < line.length; i++) {
        //ignore commented lines
        if(line[i] === "#") {
            break;
        }

        if(!isAlphaNumeric(line[i])) {
            if(isValid) {
                // began parsing non-alphanumeric char, push buffer to data, wait for next
                // clear buffer
                data.push(buffer.join(''));
                buffer = [];
                isValid = false;
            }
        } else {
            if(!isValid) {
                // began parsing alphanumeric characters
                isValid = true;
            }
            buffer.push(line[i]);
        }
    }

    //flush buffer if it has data still
    if(buffer.length) {
        data.push(buffer.join(''));
    }

    //return data
    if(!data.length) {
        // instuction data is empty (empty line, return null)
        return null;
    } else if (data.length === 1 && line.endsWith(":")) {
        //return label
        return {
            type: "label",
            data
        } as textInstruction;
    } else {
        //return instruction
        return {
            type: "instruction",
            data
        } as textInstruction;
    }
}

function isAlphaNumeric(char:string): boolean {
    let specialChars:string[] = [".", "_"];
    let code:number = char.charCodeAt(0);
    if(
        (code > 47 && code < 58) ||        // 0-9
        (code > 64 && code < 91) ||        // A-Z
        (code > 96 && code < 123) || specialChars.includes(char)       // a-z
    ) {
        return true;
    }
    return false;
}