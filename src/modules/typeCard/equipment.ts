
export default class Equipment {
    
    default: any;

    private _durability: number;

    constructor(config: any, durability: number) {
        this.default = config;
        this._durability = durability;
    }

    get durability() {
        return this._durability;
    }

    set durability(value: number) {
        this._durability = value;
    }

    get price() {
        return this._durability;
    }

}
