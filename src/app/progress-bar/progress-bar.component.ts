import { Component, OnInit } from '@angular/core';
import { MessageService } from '../message.service';
import { Message, QueryEvent } from '../message';
import { Job, Task } from '../job';
import { MatTableDataSource } from '@angular/material/table';
import { TaskStateService } from '../task-state.service';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Inject } from '@angular/core';


interface Job_flat {
    unique_id: string;
    jobid: string;
    tasks: Task[];
}

const JobInfors: Job[] = [
    {
        "unique_id": "uid",
        "jobid": "Job",
        "tasks": {
            "T": {
                "taskid": "T1", "state": "P"
            }
        }
    }
];


@Component({
    selector: 'app-progress-bar',
    templateUrl: './progress-bar.component.html',
    styleUrls: ['./progress-bar.component.css']
})
export class ProgressBarComponent implements OnInit {

    private notify_allow: boolean = false;
    jobs: { [index: string]: Job } = {};
    jobSource = JobInfors;
    displayedColumns: string[] = ['uid', 'Name', 'Tasks'];
    dataSource = new MatTableDataSource<Job_flat>();
    current_open_message: string[] = [];

    constructor(
        private msg_service: MessageService,
        private tss: TaskStateService,
        private dialog: MatDialog) {

        this.msg_service.register(msg => msg.type == "job.msg").subscribe(msg => {
            this.job_state_message_handle(msg);
        });
    }

    ngOnInit(): void {
        /**
         * Query current state from Master.
         */
        this.msg_service.sendMsg(new QueryEvent(["processing"]));

        let subscribtion = this.msg_service.register(msg => msg.type == "job.msg.batch")
            .subscribe(init_msg => {

                // Subtype of message must a batch
                if (init_msg.content.subtype != "batch") {
                    console.log("ProgressBar init: receive error message");
                } else {
                    // Correct message type
                    for (let msg of init_msg.content.message) {
                        this.job_state_message_handle_internal(msg);
                    }

                    subscribtion.unsubscribe();
                    this.notify_allow = true;
                    this.dataSource.data = this.get_jobs()
                }
            });
    }

    job_state_message_handle(msg: Message): void {
        // Component is not initiliazed,
        // unable to process notify at this stage.
        if (this.notify_allow === false) {
            return;
        }

        this.job_state_message_handle_internal(msg);
        this.dataSource.data = this.get_jobs()
    }

    job_state_message_handle_internal(msg: Message): void {
        let content = msg.content;
        let subtype: string;

        // Corrupted by invalid format of message is
        // not allowed.
        try {
            subtype = content['subtype'];

            switch (subtype) {
                case "change":
                    this.job_state_message_change_handle(msg);
                    break;
                case "fin":
                    this.job_state_message_fin_handle(msg);
                    break;
                case "fail":
                    this.job_state_message_fail_handle(msg)
                    break;
                case "info":
                    this.job_state_message_info_handle(msg);
                    break;
            }
        } catch (error) {
            console.log(error);
        }

    }

    get_jobs(): Job_flat[] {
        let job_flats: Job_flat[] = [];

        for (let job of Object.values(this.jobs)) {
            let job_f: Job_flat = {
                "unique_id": job.unique_id,
                "jobid": job.jobid,
                "tasks": Object.values(job.tasks)
            };
            job_flats.push(job_f);
        }

        return job_flats;
    }

    is_task_success(task: Task): boolean {
        return task.state == 'FIN';
    }

    is_task_fail(task: Task): boolean {
        return task.state == 'FAIL';
    }

    job_state_message_info_handle(msg: Message): void {
        let message: { [index: string]: any } = msg['content']['message'];
        if (typeof message == 'undefined')
            return

        // Treat as a trivial job just drop it.
        if (message["tasks"].length == 0)
            return;

        // Build Task dictionary.
        let tasks: { [index: string]: Task } = {};
        for (let task of message["tasks"]) {
            tasks[task[0]] = { "taskid": task[0], "state": task[1] };
        }

        // Build Job.
        let job: Job = {
            "unique_id": message['unique_id'],
            "jobid": message['jobid'],
            "tasks": tasks
        };

        this.jobs[message['unique_id']] = job;
    }

    job_state_message_change_handle(msg: Message): void {
        let content = msg['content']['message'];

        let job = this.jobs[content['unique_id']];
        if (typeof job == 'undefined')
            return;

        let task = job.tasks[content['taskid']];
        if (typeof task == 'undefined')
            return;

        task.state = content['state'];
    }

    job_state_message_fin_handle(msg: Message): void {
        let content = msg['content']['message'];
        let unique_id: string = content['jobs'][0];

        delete this.jobs[unique_id];
    }

    job_state_message_fail_handle(msg: Message): void {
        let content = msg['content']['message'];
        let unique_id: string = content['jobs'][0];

        delete this.jobs[unique_id];

    }

    get_task_message_log(uid: string, taskId: string): void {
        // Retrieve task log message.
        let sub = this.tss.taskLogMessage(uid, taskId).subscribe(message => {
            this.current_open_message.push(message);
        });

        // Open a dialog to display messages.
        this.dialog.open(TaskLogDialogProgress, {
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
export class TaskLogDialogProgress {

    public version: string;

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: any,
        public dialogRef: MatDialogRef<TaskLogDialogProgress>) { }

    onCancel(): void {
        this.dialogRef.close();
    }
}
