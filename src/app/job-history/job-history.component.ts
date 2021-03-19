import { Component, OnInit } from '@angular/core';
import { MessageService } from '../message.service';
import { Message, QueryEvent } from '../message';
import { Job, Task } from '../job';
import { MatTableDataSource } from '@angular/material/table';
import { TaskStateService } from '../task-state.service';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Inject } from '@angular/core';


@Component({
    selector: 'app-job-history',
    templateUrl: './job-history.component.html',
    styleUrls: ['./job-history.component.css']
})
export class JobHistoryComponent implements OnInit {

    history: Job[] = [];
    displayedColumns: string[] = ['uid', 'Name', 'Tasks']
    dataSource = new MatTableDataSource<Job>([]);
    current_open_message: string[] = [];

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
        let sub = this.tss.taskLogMessage(uid, taskId).subscribe(message => {
            console.log("Message arrived")
            this.current_open_message.push(message);
        });

        this.dialog.open(TaskLogDialogHistory, {
            width: '30cm',
            data: {
                dataKey: this.current_open_message
            }
        }).afterClosed().subscribe(_ => {
            sub.unsubscribe();
            this.current_open_message = [];
        });
    }
}


@Component({
    selector: 'task-log-dialog',
    templateUrl: 'task_log_msg_dialog.html'
})
export class TaskLogDialogHistory {

    public version: string;

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: any,
        public dialogRef: MatDialogRef<TaskLogDialogHistory>) { }

    onCancel(): void {
        this.dialogRef.close();
    }
}
