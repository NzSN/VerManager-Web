import { Component, OnInit } from '@angular/core';
import { MessageService } from '../message.service';
import { Message, QueryEvent } from '../message';
import { Job, Task } from '../job';
import { MatTableDataSource } from '@angular/material/table';
import { TaskStateService } from '../task-state.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';


@Component({
    selector: 'app-job-history',
    templateUrl: './job-history.component.html',
    styleUrls: ['./job-history.component.css']
})
export class JobHistoryComponent implements OnInit {

    history: Job[] = [];
    displayedColumns: string[] = ['uid', 'Name', 'Tasks']
    dataSource = new MatTableDataSource<Job>([]);

    constructor(
        private msg_service: MessageService,
        private tss: TaskStateService,
        private dialog: MatDialog) {

        this.msg_service.register(msg => msg.type == "job.msg.history")
            .subscribe(history_msg => {
                this.history_msg_handle(history_msg);
            });
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

    get_task_log_messages(uid: string, taskId: string): void {
        this.dialog.open(TaskLogDialog, { width: '30cm' });
        this.tss.taskLogMessage(uid, taskId).subscribe(message => {
            let log_dialog = document.getElementById("log_dialog");

            let log_message = document.createElement("p");
            log_message.appendChild(document.createTextNode(message));
            log_dialog.appendChild(
                log_message
            );
        });
    }
}


@Component({
    selector: 'task-log-dialog',
    templateUrl: 'task_log_msg_dialog.html'
})
export class TaskLogDialog {

    public version: string;

    constructor(
        public dialogRef: MatDialogRef<TaskLogDialog>) { }

    onCancel(): void {
        this.dialogRef.close();
    }
}
