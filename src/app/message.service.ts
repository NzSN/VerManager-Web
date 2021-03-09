import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Message, message_check } from './message';
import { ChannelService } from "./channel.service";
import { Channel } from "./channel";



class MessageQueue {
    private data: Message[] = [];

    len(): number {
        return this.data.length;
    }

    isFull(): boolean {
        return this.len() > 0;
    }

    isEmpty(): boolean {
        return this.len() == 0;
    }

    push(msg: Message): void {
        this.data.push(msg);
    }

    pop(): Message {
        return this.data.pop();
    }

    shift(): Message {
        return this.data.shift();
    }
}

@Injectable({
    providedIn: 'root'
})
export class MessageService {

    private sock_url = "/commu/";

    /**
     * With Help of msg_queues MessageService able to
     * provide messages that from server, to another
     * components or services.
     *
     *  ---- message ---> MessageService ---> queue ---> component
     */
    private msg_queues: { [index: string]: MessageQueue } = {};
    private channel: Channel<Object>;

    constructor(private channelService: ChannelService) {
        this.channel = this.channelService.create(
            "ws://" + location.host + this.sock_url
        );

        this.channel.subscribe({
            next: msg => {

                if (message_check(msg) === false) {
                    // invalid message
                    return;
                }

                let message: Message = {
                    "type": msg["type"],
                    "content": msg["content"]
                };
                let msg_type: string = message.type;

                // If type of thie message is subscribe then add it to
                // correspond queue.
                if (typeof this.msg_queues[msg_type] != 'undefined') {
                    this.msg_queues[message.type].push(message);
                }
            },
            error: err => {
                console.log(err);
            },
            complete: () => {
                console.log("complete");
            }
        });
    }

    register(msg_type: string): Observable<Message> | null {
        // To check that is this msg_type is unique.
        if (typeof this.msg_queues[msg_type] == "undefined") {
            this.msg_queues[msg_type] = new MessageQueue();
        } else
            return null;

        return new Observable(msg_receiver => {
            setInterval(() => {
                let q: MessageQueue = this.msg_queues[msg_type];

                while (!q.isEmpty()) {
                    msg_receiver.next(q.shift());
                }
            }, 1000);
        });
    }

    sendMsg(msg: Message): void {
        this.channel.sendMsg(msg);
    }
}
