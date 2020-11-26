import { Component, OnInit } from '@angular/core';
import { MessageService } from '../message.service';
import { Message } from '../message';

interface Task {
    taskid: string;
    state: string;
}

interface Job {
    jobid: string;
    tasks: { [index: string]: Task };
}

interface Job_flat {
    jobid: string;
    tasks: Task[];
}

const JobInfors: Job[] = [
    { "jobid": "Job", "tasks": { "T": { "taskid": "T1", "state": "P" } } }
];


@Component({
    selector: 'app-progress-bar',
    templateUrl: './progress-bar.component.html',
    styleUrls: ['./progress-bar.component.css']
})
export class ProgressBarComponent implements OnInit {

    jobs: { [index: string]: Job } = {};
    jobSource = JobInfors;
    columnDisplay = ['Job', 'Tasks'];

    constructor(msg_service: MessageService) {
        msg_service.register("JobMsg").subscribe(msg => {
            this.job_state_message_handle(msg);
        });
    }

    ngOnInit(): void { }

    job_state_message_handle(msg: Message): void {
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
                "jobid": job.jobid,
                "tasks": Object.values(job.tasks)
            };
            job_flats.push(job_f);
        }

        return job_flats;
    }

    job_state_message_info_handle(msg: Message): void {
        let message: { [index: string]: any } = msg['content']['message'];

        // Build Task dictionary.
        let tasks: { [index: string]: Task } = {};
        for (let taskid of message["tasks"]) {
            tasks[taskid] = { "taskid": taskid, "state": message["state"] };
        }

        // Build Job.
        let job: Job = {
            "jobid": message['jobid'],
            "tasks": tasks
        };

        this.jobs[message['jobid']] = job;
    }

    job_state_message_change_handle(msg: Message): void {
        let content = msg['content']['message'];
        let jobid: string = content['jobid'];
        let taskid: string = content['taskid'];
        let state: string = content['state'];

        this.jobs[jobid].tasks[taskid].state = state;
    }

    job_state_message_fin_handle(msg: Message): void {
        let content = msg['content']['message'];
        let jobid: string = content['jobid'];

        delete this.jobs[jobid]
    }

    job_state_message_fail_handle(msg: Message): void {
        let content = msg['content']['message'];
        let jobid: string = content['jobid'];

        delete this.jobs[jobid]

    }
}
