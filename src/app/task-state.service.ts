import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Message } from './message';
import { MessageService } from './message.service';

@Injectable({
    providedIn: 'root'
})
export class TaskStateService {

    private database: IDBDatabase;
    /**
     * An container to place taks log content,
     * each task has space no more than cache_limit's value.
     * If content is execeed the limit then the content of
     * cache will flush into IndexedDB as a Blob.
     */
    private log_cache: { [index: string]: string };
    // Unit is KB
    cache_limit: number = 1024;

    constructor(private msg_service: MessageService) {
        // Get database or create if it doesn't exists.
        this.database = this.init_db();

        // Register message
        this.msg_service.register("tss.msg").subscribe(msg => {
            this.tss_msg_handle(msg);
        });
    }

    private tss_msg_handle(msg: Message): void {
        return;
    }

    taskLogMessage(tid: string): Observable<string> {
        // Is log exist in IndexedDB ?
        if (this.is_item_exists(tid)) {
            return this.load_task_log(tid);
        } else {
            /**
             * Load task log from remote
             * theses message load from master will cached into localStorage
             */
            this.load_task_log_from_remote(tid).subscribe(msg => {

            });
        }

        return;
    }

    private init_db(): IDBDatabase {
        let database: IDBDatabase;
        const request = indexedDB.open('taskLogDB');

        request.onsuccess = function(event) {
            database = request.result;
        };

        request.onerror = function(event) {
            alert("Error loading database");
        };

        return database;
    }

    private is_item_exists(tid: string): boolean {
        return true;
    }

    private load_task_log(tid: string): Observable<string> {
        return;
    }

    private load_task_log_from_remote(tid: string): Observable<string> {

    }
}
