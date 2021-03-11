import { Injectable } from '@angular/core';
import { Observable, Observer, from } from 'rxjs';
import { concatMap, map } from 'rxjs/operators';
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
};

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
    private log_pos: { [index: string]: number } = {};

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

    cleanPersistentData(): Observable<boolean> {
        let cleared: boolean = undefined;
        let db = this.access_db();
        if (db == null) {
            return;
        }

        db.subscribe(db => {
            let transaction = db.transaction([this.log_store_name], "readwrite");
            let obStore = transaction.objectStore(this.log_store_name);

            let req = obStore.clear();
            req.onsuccess = (event) => {
                cleared = true;
            };
            req.onerror = (event) => {
                cleared = false;
            };
        });

        return new Observable(ob => {
            let intvl = setInterval(() => {
                if (cleared != undefined) {
                    ob.next(cleared);
                    ob.complete();
                    clearInterval(intvl);
                }
            }, 1000);
        })
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
                    ob.complete();
                } else if (this.database == null) {
                    clearInterval(intvl);
                    ob.complete();
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
            let req = obStore.openCursor(tid);

            req.onsuccess = (event) => {
                let cursor = req.result;

                if (cursor) {
                    exists = true;
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
                    ob.complete();
                }
            }, 1000);
        });
    }

    private load_task(tid: string, isLocal: boolean): Observable<string> {

        let load_from_remote_with_cache =
            this.load_task_log_from_remote(tid).pipe(
                // Cache message
                concatMap(msg => {
                    this.log_pos[tid] += msg.length;
                    this.cache(tid, msg);
                    return from([msg]);
                }),
            );

        if (isLocal) {
            return this.load_task_log_from_local(tid).pipe(
                // If there is only part of log reside
                // on local then need to load rest of log
                // from master
                concatMap(msg => (() => {
                    if (msg == null) {
                        return load_from_remote_with_cache;
                    } else {
                        return from([msg]);
                    }
                })())
            );
        } else {
            return load_from_remote_with_cache;
        }
    }

    // precondition: item exist in IndexedDB
    private load_task_log_from_local(tid: string): Observable<string> {
        let load_success: boolean = undefined;
        let log_messages: InfoLogUnit = undefined;

        let db = this.access_db();

        if (db == null) {
            // Fail to access database return empty message.
            return from([""]);
        }

        db.subscribe(db => {
            let transaction = db.transaction([this.log_store_name])
            let obStore = transaction.objectStore(this.log_store_name);

            let req = obStore.get(tid);

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
                    if (!(tid in this.log_pos)) {
                        this.log_pos[tid] = log_messages.length;
                    }
                    this.load_task_log_from_local_internal(
                        ob, log_messages.logBlobs, log_messages.fin);
                    clearInterval(intvl);
                } else if (load_success == false) {
                    ob.next("");
                    ob.complete();
                    clearInterval(intvl);
                }
            })
        })
    }

    private load_task_log_from_local_internal(
        ob: Observer<string>, messages: Blob[], isFin: boolean): void {

        let prev: Promise<string> = messages[0].text();
        let proc_messages = messages.slice(1, messages.length);

        for (let msg of proc_messages) {
            prev = prev.then(text => {
                ob.next(text);
                return msg.text();
            })
        }

        prev.then(text => {
            ob.next(text);
            if (isFin) {
                ob.next("");
            } else {
                ob.next(null);
            }

            ob.complete();
        });
    }

    private load_task_log_from_remote(tid: string): Observable<string> {
        let pos: number;

        if (!(tid in this.log_pos)) {
            // No position info about the task
            // so there is no log file on local
            // and set pos to 0, with 0 system
            // able to get all data of log.
            pos = this.log_pos[tid] = 0;
        } else {
            pos = this.log_pos[tid];
        }

        this.msg_service.sendMsg(
            new QueryEvent(["task", tid, tid, (pos as any) as string])
        );
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
            this.persistent_store(tid, data == "");

            // Flush all cache
            this.log_cache[tid] = "";
        }
    }

    /**
     * Store the cache that correspond to the tid
     * into IndexedDB.
     */
    private persistent_store(tid: string, isLast: boolean): void {

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
            'length': cache.length,
            'fin': isLast
        }

        db.subscribe(db => {
            let transaction = db.transaction([this.log_store_name], "readwrite");
            let obStore = transaction.objectStore(this.log_store_name);

            let request_current = obStore.openCursor(tid);
            request_current.onsuccess = (event) => {
                let cursor = request_current.result;

                if (cursor) {
                    // Store the last cache into database
                    let current_data: InfoLogUnit = cursor.value;
                    current_data.logBlobs.push(blob);
                    current_data.length += cache.length;
                    current_data.fin = isLast;

                    let request_update = obStore.put(current_data);
                    request_update.onerror = (event) => {
                        this.unstable_tasks.push(tid);
                    }
                } else {
                    // No info of the task is stored in database
                    // create a new one.
                    let request = obStore.add(logInfo);
                    request.onerror = (event) => {
                        // Mark the task which tid equal to parameter
                        // as a unstable state to prevent break of
                        // data within database.
                        this.unstable_tasks.push(tid);
                    }

                }
            }
        });
    }

    mark_fin(tid: string): void {
        this.set_fin_state(tid, true);
    }

    set_fin_state(tid: string, fin: boolean): void {
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

                data.fin = fin;

                let put_request = obStore.put(data);
                put_request.onerror = (event) => {
                    this.unstable_tasks.push(tid);
                };

            };
        })
    }
}
