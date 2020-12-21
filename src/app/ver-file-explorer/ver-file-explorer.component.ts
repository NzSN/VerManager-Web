import { Component, OnInit } from '@angular/core';
import { MessageService } from '../message.service';
import { VerResult } from './verResult';
import { Message, QueryEvent } from '../message';


@Component({
    selector: 'app-ver-file-explorer',
    templateUrl: './ver-file-explorer.component.html',
    styleUrls: ['./ver-file-explorer.component.css']
})
export class VerFileExplorerComponent implements OnInit {

    private results: { [index: string]: VerResult } = {};
    constructor(private msgService: MessageService) { }

    ngOnInit(): void {
        // Send an event to master to acquire already generated
        // files.
        this.msgService.sendMsg(new QueryEvent(["files"]));
        this.msgService.register("job.msg.file.exists").subscribe(msg => {
            let message: Object = msg.content.message;

            for (let idx in message) {
                this.results[idx] = message[idx];
            }

            this.switchToGrowState();
        });
    }

    switchToGrowState(): void {
        this.msgService.register("job.msg.file.new").subscribe(msg => {
            let file: VerResult = msg.content.message;
            let unique_id: string = file['unique_id'];

            if (unique_id in this.results) {
                return;
            } else {
                this.results[unique_id] = file;
            }
        });
    }

    files_dict(): { [index: string]: VerResult } {
        return this.results;
    }

    files(): VerResult[] {
        return Object.values(this.results);
    }

}
