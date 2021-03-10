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
        service.cleanPersistentData().subscribe(cleared => {
            expect(cleared).toBeTrue();
            service.taskLogMessage("TID").subscribe(data => {
                if (data == "") {
                    done();
                } else {
                    expect(data).toBe("FakeMessage");
                }
            });
        });
    });

    it('Query Task from local', (done) => {
        service.cleanPersistentData().subscribe(cleared => {
            expect(cleared).toBeTrue;

            // Run two times of taskLogMessage
            // so the second call of taskLogMessage
            // should be read from local
            service.taskLogMessage("TID").subscribe(data => {
                if (data == "") {
                    service.taskLogMessage("TID").subscribe(data_local => {
                        if (data_local == '') {
                            done();
                        } else {
                            expect(data_local.length).toBeCloseTo(1023);
                        }
                    })
                }
            });

        });
    });

    it('Query Task which only part of info reside on local', (done) => {
        service.cleanPersistentData().subscribe(cleared => {
            expect(cleared).toBeTrue;

            // Read data from remote
            service.taskLogMessage("TID").subscribe(data => {
                if (data == "") {
                    // Mark log as unfinished
                    service.set_fin_state("TID", false);
                    // Load log message from both local and remote
                    setTimeout(() => {
                        service.taskLogMessage("TID").subscribe(data => {
                            if (data == "") {
                                done();
                            }
                        })
                    }, 1000);
                }
            })

        })
    })
});
