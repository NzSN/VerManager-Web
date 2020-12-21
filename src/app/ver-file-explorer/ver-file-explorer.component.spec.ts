import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VerFileExplorerComponent } from './ver-file-explorer.component';
import { MessageService } from '../message.service';
import { VerResult } from './verResult';
import { Message } from '../message';
import { Observable } from 'rxjs';


class MessageServiceFake {

    register_exists(): Observable<Message> {
        return new Observable(ob => {
            let msg: Message = {
                "type": "job.msg.file.exists",
                "content": {
                    "subtype": "job.msg.file.exists",
                    "message": {
                        "0": {
                            "unique_id": "0",
                            "ver_id": "t0",
                            "url": "url0"
                        },
                        "1": {
                            "unique_id": "1",
                            "ver_id": "t1",
                            "url": "url1"
                        },
                        "2": {
                            "unique_id": "2",
                            "ver_id": "t2",
                            "url": "url2"
                        },
                    }
                }
            };

            ob.next(msg);
        });
    }

    register_new(): Observable<Message> {
        return new Observable(ob => {
            let msg: Message = {
                "type": "job.msg.file.new",
                "content": {
                    "subtype": "job.msg.file.new",
                    "message": {
                        "unique_id": "3",
                        "ver_id": "t3",
                        "url": "url3"
                    }
                }
            }

            ob.next(msg);
        });
    }

    register(msg_type: string): Observable<Message> | null {
        switch (msg_type) {
            case "job.msg.file.exists":
                return this.register_exists();
            case "job.msg.file.new":
                return this.register_new();
        }
    }

    sendMsg(msg: Message): void { }

}


describe('VerFileExplorerComponent', () => {
    let component: VerFileExplorerComponent;
    let fixture: ComponentFixture<VerFileExplorerComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [VerFileExplorerComponent],
            providers: [{ provide: MessageService, useClass: MessageServiceFake }],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(VerFileExplorerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should create Verfiles', done => {
        let files = component.files_dict()

        setTimeout(() => {
            expect(files["0"]).toEqual({ "unique_id": "0", "ver_id": "t0", "url": "url0" });
            expect(files["1"]).toEqual({ "unique_id": "1", "ver_id": "t1", "url": "url1" });
            expect(files["2"]).toEqual({ "unique_id": "2", "ver_id": "t2", "url": "url2" });
            expect(files["3"]).toEqual({ "unique_id": "3", "ver_id": "t3", "url": "url3" });
            done();
        }, 1000);
    });
});
