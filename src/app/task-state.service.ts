import { Injectable } from '@angular/core';
import { Observable, Observer, from } from 'rxjs';
import { concatMap } from 'rxjs/operators';
import { Message } from './message';
import { MessageService } from './message.service';
import { QueryEvent } from './message';

interface InfoLogUnit {
    tid: string;
    // Length of log message
    length: number;
    logBlobs: Blob[];
    // field to indicate that
    // is the log message is
    // completly store into Database.
    fin: boolean;
}


@Injectable({
    providedIn: 'root'
})
export class TaskStateService {

    private database_name: string = "TaskInfo";
    private log_store_name: string = "TaskLog";

    private database: IDBDatabase = undefined;
    /**
     * An container to place taks log content,
     * each task has space no more than cache_limit's value.
     * If content is execeed the limit then the content of
     * cache will flush into IndexedDB as a Blob.
     */
    private log_cache: { [index: string]: string } = {};
    // Unit is KB
    private cache_limit: number = 1024;
    // Observable that use while load task info from master.
    private recv: Observable<Message>;
    // Unstable Task info
    private unstable_tasks: string[] = [];

    constructor(private msg_service: MessageService) {
        // Register message
        this.recv = this.msg_service.register("tss.msg");
    }

    taskLogMessage(tid: string): Observable<string> {
        // Is log exist in IndexedDB ?
        return this.is_item_exists(tid).pipe(
            concatMap(exists => this.load_task(tid, exists))
        );
    }

    private access_db(): Observable<IDBDatabase> | null {

        if (this.database == undefined || this.database == null) {
            // Open database
            const request = indexedDB.open(this.database_name, 1);

            request.onupgradeneeded = (event) => {
                let database = request.result;

                database.createObjectStore(
                    this.log_store_name, { keyPath: "tid" }
                )
            }

            request.onsuccess = (event) => {
                this.database = request.result;
            };

            request.onerror = (event) => {
                this.database = null;
            };
        }

        return new Observable(ob => {
            let intvl = setInterval(() => {
                if (typeof this.database != 'undefined') {
                    ob.next(this.database);
                    clearInterval(intvl);
                } else if (this.database == null) {
                    clearInterval(intvl);
                }
            }, 100);
        });
    }

    private is_item_exists(tid: string): Observable<boolean> {

        let exists: boolean = undefined;

        let db: Observable<IDBDatabase> | null = this.access_db()

        if (db == null) {
            // Assume that the log message is not exists
            return from([false]);
        }

        db.subscribe(db => {

            let transaction = db.transaction([this.log_store_name]);
            let obStore = transaction.objectStore(this.log_store_name);

            // ifa the ObjectStore is exists then there must
            // exist an object with key is '0', cause the
            // blob which key is '0', is the first object
            // store into ObjectStore.
            let req = obStore.openCursor();

            req.onsuccess = (event) => {
                let cursor = req.result;

                if (cursor) {
                    if (cursor.key == tid) {
                        exists = true;
                    } else {
                        cursor.continue();
                    }
                } else {
                    exists = false;
                }
            }

            req.onerror = (event) => {
                exists = false;
            }

        });


        return new Observable(ob => {
            let counter = setInterval(() => {
                if (typeof exists != 'undefined') {
                    clearInterval(counter);
                    ob.next(exists);
                }
            }, 1000);
        });
    }

    private load_task(tid: string, isLocal: boolean): Observable<string> {
        if (isLocal) {
            return this.load_task_log_from_local(tid);
        } else {
            return this.load_task_log_from_remote(tid).pipe(
                // Cache message
                concatMap(
                    msg => (() => {
                        this.cache(tid, msg);
                        if (msg == "") {
                            // Transfer complete no more data
                            // will be transfered, just mark
                            // the it as an complete log in database.
                            this.mark_fin(tid);
                        }
                        return from([msg]);
                    })()
                )
            );
        }
    }

    // precondition: item exist in IndexedDB
    private load_task_log_from_local(tid: string): Observable<string> {
        let load_success: boolean = undefined;
        let log_messages: Blob[] = undefined;


        let db = this.access_db();

        if (db == null) {
            // Fail to access database return empty message.
            return from([""]);
        }

        db.subscribe(db => {
            let transaction = db.transaction([this.log_store_name])
            let obStore = transaction.objectStore(this.log_store_name);

            let req = obStore.getAll();
            log_messages = req.result;

            req.onsuccess = () => {
                log_messages = req.result;
                load_success = true;
            }

            req.onerror = () => {
                load_success = false;
            }
        });

        return new Observable(ob => {
            let intvl = setInterval(() => {
                if (load_success == true && typeof log_messages != 'undefined') {
                    this.load_task_log_from_local_internal(ob, log_messages);
                    clearInterval(intvl);
                } else if (load_success == false) {
                    ob.next("");
                    clearInterval(intvl);
                }
            })
        })
    }

    private load_task_log_from_local_internal(ob: Observer<string>, messages: Blob[]): void {
        for (let msg of messages) {
            let text = msg.text().then(text => {
                ob.next(text);
            })
        }
    }

    private load_task_log_from_remote(tid: string): Observable<string> {
        this.msg_service.sendMsg(new QueryEvent(["task", tid]));

        return this.recv.pipe(
            concatMap(msg => from([msg.content.message])),
        );
    }

    /**
     * Reture:
     *   True: Need to store into IndexedDB
     *   False: No Need to store into IndexedDB
     */
    private cache(tid: string, data: string): void {

        let exists = tid in this.log_cache;
        if (!exists) {
            this.log_cache[tid] = "";
        }

        // Cache update
        this.log_cache[tid] = this.log_cache[tid] + data;

        // Persistent Store
        if (this.log_cache[tid].length > this.cache_limit || data == "") {
            // Cache length exceed cache limit need to store
            // store into IndexedDB.
            console.log("persistent_store");
            this.persistent_store(tid);

            // Flush all cache
            this.log_cache[tid] = "";
        } else {
            console.log("Under limit");
        }
    }

    /**
     * Store the cache that correspond to the tid
     * into IndexedDB.
     */
    private persistent_store(tid: string): void {

        if (tid in this.unstable_tasks) {
            // The info of the task is in unstable
            // state, if store data into it may break
            // the correctness of the data.
            return;
        }

        // WRAP cache into Blob
        const cache = this.log_cache[tid];
        const blob = new Blob([cache]);

        // Store the Blob into IndexedDB
        let db: Observable<IDBDatabase> | null = this.access_db();

        if (db == null) {
            // Fail to access IndexedDB skip persistent_store.
            return;
        }

        // Store blob with count as key.
        let logInfo: InfoLogUnit = {
            'tid': tid,
            'logBlobs': [blob],
            'length': 0,
            'fin': false
        }

        db.subscribe(db => {
            let transaction = db.transaction([this.log_store_name], "readwrite");
            let obStore = transaction.objectStore(this.log_store_name);

            let request_current = obStore.get(tid);
            request_current.onsuccess = (event) => {
                // Store the last cache into database
                let current_data: InfoLogUnit = request_current.result;
                current_data.logBlobs.push(blob);

                let request_update = obStore.put(current_data);
                request_update.onerror = (event) => {
                    this.unstable_tasks.push(tid);
                }
            }

            request_current.onerror = (event) => {
                // No info of the task is stored in database
                // create a new one.
                let request = obStore.add(logInfo);
                request.onsuccess = (event) => {

                    console.log("Persistent store success");
                }
                request.onerror = (event) => {
                    console.log("Fail to store");
                    // Mark the task which tid equal to parameter
                    // as a unstable state to prevent break of
                    // data within database.
                    this.unstable_tasks.push(tid);
                }
            }


        });
    }

    private mark_fin(tid: string): void {
        if (tid in this.unstable_tasks) {
            return;
        }

        let db: Observable<IDBDatabase> | null = this.access_db();

        if (db == null) {
            return;
        }

        db.subscribe(db => {
            let transaction = db.transaction([this.log_store_name], "readwrite");
            let obStore = transaction.objectStore(this.log_store_name);

            let request_current = obStore.get(tid);
            request_current.onsuccess = (event) => {
                let data: InfoLogUnit = request_current.result;

                data.fin = true;

                let put_request = obStore.put(data);
                put_request.onerror = (event) => {
                    this.unstable_tasks.push(tid);
                };

            };
        })
    }
}
