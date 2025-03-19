export default class Package {
    key: string = "";
    values: Array<any> = [];
    value: string | undefined = "";
    start: number = -1;
    end: number = -1;
    constructor(pkg?: Package) {
        if (pkg) {
            this.key = pkg.key;
            this.values = pkg.values;
            this.value = pkg.value;
            this.start = pkg.start;
            this.end = pkg.end;
        }
    }
}
