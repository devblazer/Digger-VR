import $ from 'jquery';

if (!window.indexedDB)
    window.indexedDB = window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
if (!window.IDBTransaction)
    window.IDBTransaction = window.webkitIDBTransaction || window.msIDBTransaction;
if (!window.IDBKeyRange)
    window.IDBKeyRange = window.webkitIDBKeyRange || window.msIDBKeyRange;

export default class DB {
    constructor(name='local2',tables=['main'],version=1) {
        const p = this._private = {
            name,
            tables,
            version,
            db:null,
            ready:false,
            readyCallback:null
        };

        var request = window.indexedDB.open(name, version);

        request.onerror = function(event) {
            console.log("error opening database");
        };
        request.onblocked = function(event) {
            console.log("error blocked database");
        };

        request.onsuccess = function(event) {
            p.db = request.result;
            p.ready = true;
            console.log('success');
            if (p.readyCallback)
                p.readyCallback();
        };

        request.onupgradeneeded = function(event) {
            console.log('upgrade');
            p.db = event.target.result;
            p.tables.forEach(table=>{
                p.db.createObjectStore(table, {keyPath: "id"});
            });
        }
    }

    ready(callback){
        if (this._private.ready)
            callback();
        else
            this._private.readyCallback = callback;
    }

    set(table='main',objects,complete,success,failure){
        objects = $.isArray(objects)?objects:[objects];
        let progress = {
            errors: 0,
            success: 0
        };

        function check() {
            if (progress.success+progress.errors == objects.length && complete)
                complete();
        }

        function eSuccess(event) {
            progress.success++;
            if (success)
                success(event);
            check();
        }
        function eError(event) {
            console.log('db error occurred setting data on '+table);
            console.log(event);
            if (failure)
                failure(event);
            progress.errors++;
            check();
        }

        const store = this._private.db.transaction([table],'readwrite').objectStore(table);
        objects.forEach(object=>{
            let request = store.put(object);
            request.onsuccess = eSuccess;
            request.onerror = eError;
        });
    }

    clear(table='main',success,failure) {
        console.log('clear');
        const store = this._private.db.transaction(table).objectStore(table);
        const me = this;
        const ids = []
        store.openCursor().onsuccess = function(event) {
            var cursor = event.target.result;
            if (cursor) {
                ids.push(cursor.key);
                cursor.continue();
            }
            else {
                console.log(ids);
                me.remove(table, ids, null, failure, success);
            }
        };
    }

    get(table='main',ids,success,failure,complete) {
        ids = $.isArray(ids)?ids:[ids];
        let progress = {
            errors: 0,
            success: 0
        };

        function check() {
            if (progress.success+progress.errors == ids.length && complete)
                complete();
        }

        const store = this._private.db.transaction([table],'readwrite').objectStore(table);
        ids.forEach(id=>{
            const request = store.get(id);
            request.onsuccess = function eSuccess(event) {
                progress.success++;
                if (success)
                    success(request.result,event);
                check();
            };
            request.onerror = function eError(event) {
                console.log('db error occurred getting data on '+table+' for id '+id);
                console.log(event);
                if (failure)
                    failure(event);
                progress.errors++;
                check();
            };
        });
    }

    remove(table='main',ids,success,failure,complete) {
        ids = $.isArray(ids)?ids:[ids];
        let progress = {
            errors: 0,
            success: 0
        };

        function check() {
            if (progress.success+progress.errors == ids.length && complete)
                complete();
        }

        const store = this._private.db.transaction([table],'readwrite').objectStore(table);
        ids.forEach(id=>{
            const request = store.delete(id);
            request.onsuccess = function eSuccess(event) {
                progress.success++;
                if (success)
                    success(request.result,event);
                check();
            };
            request.onerror = function eError(event) {
                console.log('db error occurred getting data on '+table+' for id '+id);
                console.log(event);
                if (failure)
                    failure(event);
                progress.errors++;
                check();
            };
        });
    }
}
