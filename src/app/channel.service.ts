import { Injectable } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { Channel } from './channel';


@Injectable({
    providedIn: 'root'
})
export class ChannelService {

    private channels: { [index: string]: WebSocketSubject<Object> } = {};
    constructor() { }

    create(url: string): Channel<Object> {
        let socket: WebSocketSubject<Object>;

        if (typeof this.channels[url] == 'undefined') {
            // New channel
            socket = webSocket(url);
            this.channels[url] = socket;
        } else {
            // Exist channel
            socket = this.channels[url];
        }

        return new Channel<Object>(socket);
    }

    close(url: string): void {
        if (typeof this.channels[url] != 'undefined') {
            this.channels[url].complete();
        }
    }
}
