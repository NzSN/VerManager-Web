import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { filter } from 'rxjs/operators';
import { Message } from './message';
import { ChannelService } from "./channel.service";
import { Channel } from "./channel";


@Injectable({
    providedIn: 'root'
})
export class MessageService {

    private sock_url = "/commu/";

    private channel: Channel<Message>;

    constructor(private channelService: ChannelService) {
        this.channel = this.channelService.create(
            "ws://" + location.host + this.sock_url
        ) as Channel<Message>;
    }

    register(checker: (msg: Message) => boolean): Observable<Message> | null {
        return this.channel.pipe(
            filter(msg => { return checker(msg); })
        );
    }

    sendMsg(msg: Message): void {
        this.channel.next(msg);
    }
}
