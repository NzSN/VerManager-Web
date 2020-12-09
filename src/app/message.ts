export interface Message {
    type: string;
    content: { [index: string]: any };
}

export class QueryEvent implements Message {
    type: string;
    content: { [index: string]: any };

    constructor(args: string[]) {
        this.type = "query";
        this.content = {
            "subtype": "JobMaster",
            "message": {
                "args": args
            }
        };
    }
}

export function message_check(msg: any): boolean {
    if (typeof msg == 'object') {
        if (typeof msg['type'] != 'undefined' ||
            typeof msg['content'] != 'undefined') {

            return true;
        }

        return false;
    }
}
