import { Injectable } from '@angular/core';
import { Channel } from './channel';


@Injectable({
    providedIn: 'root'
})
export class ChannelService {

    private channels: { [index: string]: Channel<Object> } = {};
    constructor() { }

    create(url: string): Channel<Object> {
        let channel: Channel<Object> = new Channel<Object>(url);

        if (this.channels[url] == undefined) {
            // New channel
            this.channels[url] = channel;
        } else {
            // Exist channel
            return this.channels[url]
        }

        return channel;
    }

    close(url: string): void {
        if (this.channels[url] != undefined) {
            this.channels[url].complete();
        }
    }
}
