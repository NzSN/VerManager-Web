import { TestBed } from '@angular/core/testing';

import { MessageService } from './message.service';
import { TaskStateService } from './task-state.service';

import { Observable } from 'rxjs';
import { Message, QueryEvent } from './message';


class MessageServiceFake_UnderLimit {

    private begin: boolean = false;

    sendMsg(query: Message): void {
        this.begin = true;
    }

    register(msg_type: string): Observable<Message> | null {
        let limit = 1024;
        let count = 0;

        return new Observable(ob => {
            let intvl = setInterval(() => {

                if (this.begin == true) {
                    let msg_string: string = "FakeMessage";
                    let message: Message = {
                        "type": "T",
                        "content": { "message": msg_string }
                    }

                    if (count + msg_string.length > limit) {
                        clearInterval(intvl);
                        message.content.message = ""
                        ob.next(message);
                    } else {
                        ob.next(message);
                    }

                    count += msg_string.length;
                }
            })
        });
    }
}

fdescribe('TaskStateService', () => {
    let service: TaskStateService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [{
                provide: MessageService, useClass: MessageServiceFake_UnderLimit
            }]
        });
        service = TestBed.inject(TaskStateService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('Query Task from remote', (done) => {
        service.taskLogMessage("TID").subscribe(data => {
            console.log(data);
        });
    });

});
