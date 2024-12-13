export class Table<T> {
    data: {[key: string]: T}

    constructor() {
        this.data = {};
    }

    get(key: string): T | null {
        if(this.data[key]) {
            return this.data[key];
        } else {
            return null;
        }
    }

    set(key: string, data: T): void {
        this.data[key] = data;
    }

    has(key:string): boolean {
        return (key in this.data);
    }
}