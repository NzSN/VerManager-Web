import { TestBed } from '@angular/core/testing';

import { MessageService } from './message.service';
import { TaskStateService } from './task-state.service';

import { Observable, from } from 'rxjs';
import { concatMap, delay, filter } from 'rxjs/operators';
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
                        count = 0;
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
        service.cleanPersistentData().pipe(
            // Clear database
            concatMap(cleared => (() => {
                expect(cleared).toBeTrue();
                return from([cleared]);
            })()),
            // Load from remote
            concatMap(_ => service.taskLogMessage("TID"))
        ).subscribe(data => {
            if (data == "") {
                done();
            } else {
                expect(data).toBe("FakeMessage");
            }
        })
    });

    it('Query Task from local', (done) => {
        service.cleanPersistentData().pipe(
            // Clear database
            concatMap(cleared => (() => {
                expect(cleared).toBeTrue();
                return from([cleared]);
            })()),
            // Load from remote
            concatMap(_ => service.taskLogMessage("TID")),
            // Load from local once all log is reside on local
            concatMap(data => (() => {
                if (data == "") {
                    return service.taskLogMessage("TID");
                } else {
                    return from([data]);
                }
            })()),
            filter(data => data == "" || data != "FakeMessage")
        ).subscribe(data => {
            if (data == "") {
                done();
            } else {
                expect(data.length).toBeCloseTo(1023);
            }
        });
    });

    it('Query Task which only part of info reside on local', (done) => {
        service.cleanPersistentData().pipe(
            // Clear database
            concatMap(cleared => (() => {
                expect(cleared).toBeTrue();
                return from([cleared])
            })()),
            // Load from remote
            concatMap(_ => service.taskLogMessage("TID")),
            // Load from local
            concatMap(data => (() => {
                if (data == "") {
                    // Mark as unfinished task
                    service.set_fin_state("TID", false);
                    // Load task
                    return service.taskLogMessage("TID").pipe(delay(1000));
                } else {
                    return from([data]);
                }
            })())
        ).subscribe(x => {
            if (x == "") {
                done();
            }
        });
    });
});
