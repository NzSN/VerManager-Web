import { WebSocketSubject } from 'rxjs/webSocket';


export class Channel<T> extends WebSocketSubject<T> {

    constructor(url: string) {
        super(url);
    }
}
