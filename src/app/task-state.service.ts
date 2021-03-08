import { Injectable } from '@angular/core';
import { Observable, Observer } from 'rxjs';
import { concatMap } from 'rxjs/operators';
import { Message } from './message';
import { MessageService } from './message.service';
import { QueryEvent } from './message';

@Injectable({
    providedIn: 'root'
})
export class TaskStateService {

    private database_name: string = "TaskLogDB";
    /**
     * An container to place taks log content,
     * each task has space no more than cache_limit's value.
     * If content is execeed the limit then the content of
     * cache will flush into IndexedDB as a Blob.
     */
    private log_cache: { [index: string]: string };
    // Unit is KB
    private cache_limit: number = 1024;
    // Observable that use while load task info from master.
    private recv: Observable<Message>;

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

    private access_db(): Observable<IDBDatabase> {

        let database: IDBDatabase = undefined;

        // Open database
        const request = indexedDB.open(this.database_name);

        request.onsuccess = (event) => {
            database = request.result;
        };

        request.onerror = (event) => {
            alert("Error loading database");
        };

        return new Observable(ob => {
            let intvl = setInterval(() => {
                if (typeof database != 'undefined') {
                    ob.next(database);
                    clearInterval(intvl);
                }
            }, 100);
        });
    }

    private is_item_exists(tid: string): Observable<boolean> {

        let exists: boolean = undefined;

        this.access_db().subscribe(db => {

            let store = db.createObjectStore(tid);

            // ifa the ObjectStore is exists then there must
            // exist an object with key is '0', cause the
            // blob which key is '0', is the first object
            // store into ObjectStore.
            let req = store.openCursor("0");

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
                concatMap(msg => () => {
                    this.cache(tid, msg);
                    return msg;
                })
            );
        }
    }

    // precondition: item exist in IndexedDB
    private load_task_log_from_local(tid: string): Observable<string> {
        let log_messages: Blob[] = undefined;

        this.access_db().subscribe(db => {
            let store = db.createObjectStore(tid);

            let req = store.getAll();

            req.onsuccess = () => {
                log_messages = req.result;
            }

            this.access_db().subscribe(db => {
                let store = db.createObjectStore(tid);
            });

        });

        return new Observable(ob => {
            setInterval(() => {
                if (typeof log_messages != 'undefined') {
                    this.load_task_log_from_local_internal(ob, log_messages);
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
            concatMap(msg => () => msg.content.message),
        )
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
        if (this.log_cache[tid].length > this.cache_limit) {
            // Cache length exceed cache limit need to store
            // store into IndexedDB.
            this.persistent_store(tid);
        }
    }

    /**
     * Store the cache that correspond to the tid
     * into IndexedDB.
     */
    private persistent_store(tid: string): void {
        // WRAP cache into Blob
        const cache = this.log_cache[tid];
        const blob = new Blob([cache]);

        // Store the Blob into IndexedDB
        let count: number = 0;

        this.access_db().subscribe(db => {
            let store = db.createObjectStore(tid);
            let countRequest = store.count()

            countRequest.onsuccess = () => {
                count = countRequest.result;
                // Store blob with count as key.
                store.add(blob, (count as any) as string);
            }

            countRequest.onerror = () => {
                alert("Failed to store cache into IndexedDB");
            }
        });
    }
}
