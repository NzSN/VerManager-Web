import { Observer, Subscription, Subject } from 'rxjs';
import { WebSocketSubject } from 'rxjs/webSocket';


export class Channel<T> {

    constructor(
        private socket: WebSocketSubject<T>
    ) { }

    subscribe(observer: Observer<T>): Subscription {
        return this.socket.subscribe(observer);
    }

    sendMsg(data: T): void {
        this.socket.next(data);
    }
}
