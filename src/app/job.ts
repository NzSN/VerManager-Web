export interface Task {
    taskid: string;
    state: string;
}

export interface Job {
    unique_id: string;
    jobid: string;
    tasks: { [index: string]: Task };
}
