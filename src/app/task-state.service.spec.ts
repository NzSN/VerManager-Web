import { TestBed } from '@angular/core/testing';

import { MessageService } from './message.service';
import { TaskStateService } from './task-state.service';

import { Observable, from } from 'rxjs';
import { concatMap, delay, filter } from 'rxjs/operators';
import { Message, QueryEvent } from './message';


class MessageServiceFake_UnderLimit {

    private begin: number = 0;

    sendMsg(_: Message): void {
        this.begin += 1;
    }

    register(msg_type: string): Observable<Message> | null {
        let count = 1;
        let limit = 128;

        return new Observable(ob => {
            setInterval(() => {

                if (this.begin == count) {
                    let msg_string: string = "FakeMessage";
                    let message: Message = {
                        "type": "T",
                        "content": {
                            "message": {
                                uid: "UID",
                                task: "TID",
                                "msg": msg_string,
                                "last": 0
                            }
                        }
                    }

                    if (count > limit) {
                        count = 0;
                        this.begin = 0;
                        message.content.message.msg = "";
                        message.content.message.last = 1;
                        ob.next(message);
                    } else {
                        ob.next(message);
                    }
                    count += 1;
                }
            }, 1)
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
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
        service = TestBed.inject(TaskStateService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('Query Task from remote', (done) => {
        let total: string = "";

        service.cleanPersistentData().pipe(
            // Clear database
            concatMap(cleared => {
                expect(cleared).toBeTrue();
                return from([cleared]);
            }),
            // Load from remote
            concatMap(_ => service.taskLogMessage("UID", "TID"))
        ).subscribe(data => {
            total += data;

            if (data == "") {
                done();
            } else {
                expect(data).toBe("FakeMessage");
            }
        })
    });

    it('Query Task from local', (done) => {
        let total: string = "";

        service.cleanPersistentData().pipe(
            // Clear database
            concatMap(cleared => {
                expect(cleared).toBeTrue();
                return from([cleared]);
            }),
            // Load from remote
            concatMap(_ => service.taskLogMessage("UID", "TID")),
            // Load from local once all log is reside on local
            concatMap(data => {
                if (data == "") {
                    return service.taskLogMessage("UID", "TID");
                } else {
                    return from([data]);
                }
            }),
            filter(data => data == "" || data != "FakeMessage")
        ).subscribe(data => {
            total += data;
            if (data == "") {
                done();
                expect(total.length).toBe(1408);
            }
        });
    });


    it('Query Task which only part of info reside on local', (done) => {
        let total: string = "";

        service.cleanPersistentData().pipe(
            // Clear database
            concatMap(cleared => {
                expect(cleared).toBeTrue();
                return from([cleared])
            }),
            // Load from remote
            concatMap(_ => service.taskLogMessage("UID", "TID")),
            // Load from local
            concatMap(data => {
                if (data == "") {
                    // Mark as unfinished task
                    service.set_fin_state("UID", "TID", false);
                    // Load task
                    return service.taskLogMessage("UID", "TID").pipe(delay(1000));
                } else {
                    return from([data]);
                }
            })
        ).subscribe(x => {
            total += x;

            if (x == "") {
                expect(total.length).toBe(4224);
                done();
            }
        });
    });


});
