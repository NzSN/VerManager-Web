import { Component, OnInit } from '@angular/core';
import { MessageService } from '../message.service';
import { Message, QueryEvent } from '../message';
import { Job, Task } from '../job';
import { MatTableDataSource } from '@angular/material/table';


@Component({
    selector: 'app-job-history',
    templateUrl: './job-history.component.html',
    styleUrls: ['./job-history.component.css']
})
export class JobHistoryComponent implements OnInit {

    history: Job[] = [];
    displayedColumns: string[] = ['uid', 'Name', 'Tasks']
    dataSource = new MatTableDataSource<Job>([]);

    constructor(private msg_service: MessageService) {
        this.msg_service.register("job.msg.history").subscribe(history_msg => {
            this.history_msg_handle(history_msg);
        })
    }

    ngOnInit(): void {
        /**
         * Observer to handle reply of this query is already
         * subscribe on constructor.
         */
        this.msg_service.sendMsg(new QueryEvent(["history"]));
    }

    history_msg_handle(msg: Message): void {
        if (msg.content['subtype'] != 'history') {
            return;
        }

        for (let obj of Object.values(msg.content['message'])) {
            let job: Job = {
                "unique_id": obj['unique_id'],
                "jobid": obj['jobid'],
                "tasks": obj['tasks']
            };
            this.history.push(job);
        }
        this.dataSource.data = this.history;
    }

    job_tasks(job: Job): Task[] {
        return Object.values(job.tasks);
    }

    is_task_success(task: Task): boolean {
        return task.state == 'FIN';
    }

    is_task_fail(task: Task): boolean {
        return task.state == "FAIL";
    }
}
