export class ApplicationError implements Error {
    public name = "ApplicationError";

    constructor(public message: string) {
        if (typeof console !== "undefined") {
            console.log(`${this.name}: ${this.message}`);
        }
    }

    toString() {
        return `${this.name}: ${this.message}`;
    }
}
