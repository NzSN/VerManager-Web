import { TestBed } from '@angular/core/testing';
import { MessageService } from './message.service';
import { Observable } from 'rxjs';
import { ChannelService } from './channel.service';
import { Message } from './message';

class ChannelServiceFake {
    producer: Observable<Object> = new Observable(obs => {
        setInterval(() => {
            obs.next({ "type": "TYPE", "content": { "123": "123" } });
        }, 1000);
    });

    create(url: string): Observable<Object> {
        return this.producer;
    }
}

describe('MessageService', () => {
    let service: MessageService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [{ provide: ChannelService, useClass: ChannelServiceFake }]
        });
        service = TestBed.inject(MessageService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('register', done => {
        service.register(msg => msg.type == "TYPE").subscribe(data => {
            expect(data).toEqual({ "type": "TYPE", "content": { "123": "123" } });
            done();
        });
    });

    it('multiple register', done => {
        let msgs: Message[] = [];

        service.register(msg => msg.type == "TYPE").subscribe(data => {
            expect(data).toEqual({ "type": "TYPE", "content": { "123": "123" } });
            msgs.push(data);

            if (msgs.length >= 2) {
                done();
            }
        });

        service.register(msg => msg.type == "TYPE").subscribe(data => {
            expect(data).toEqual({ "type": "TYPE", "content": { "123": "123" } });
            msgs.push(data);

            if (msgs.length >= 2) {
                done();
            }
        });
    });
});
