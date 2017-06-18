if (!window.indexedDB)
    window.indexedDB = window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;

if (!window.IDBTransaction)
    window.IDBTransaction = window.webkitIDBTransaction || window.msIDBTransaction;
if (!window.IDBKeyRange)
    window.IDBKeyRange = window.webkitIDBKeyRange || window.msIDBKeyRange;

class IndexedDBTable {
    constructor(tableName,getDB){
        const p = this._private = {
            tableName,
            getDB
        };
    }

    read(ind,callback) {
        const p = this._private;

        let store = p.getDB().transaction([p.tableName], "readwrite").objectStore(p.tableName);
        let request = store.get(ind);

        request.onerror = function(event) {
            throw new Error("Unable to retrieve data from "+p.tableName);
        };

        request.onsuccess = function(event) {
            callback(request.result)
        };
    }

    readEach(eachCallback, finalCallback=()=>{}) {
        const p = this._private;

        let store = p.getDB().transaction([p.tableName], "readwrite").objectStore(p.tableName);
        store.openCursor().onsuccess = function(event) {
            let cursor = event.target.result;

            if (cursor) {
                eachCallback(cursor.value);
                cursor.continue();
            }
            else
                finalCallback();
        };
    }

    readAll(callback){
        let ret = [];
        this.readEach(entry=>{
            ret.push(entry);
        },()=>{
            callback(ret);
        });
    }

    save(entry,callback=()=>{}) {
        const p = this._private;

        let store = p.getDB().transaction([p.tableName], "readwrite").objectStore(p.tableName);
        let request = store.put(entry,entry.id);

        request.onsuccess = function(event) {
            callback();
        };

        request.onerror = function(event) {
            throw new Error("Unable to save entry into "+p.tableName);
        }
    }

    delete(ind,callback=()=>{}) {
        const p = this._private;

        let store = p.getDB().transaction([p.tableName], "readwrite").objectStore(p.tableName);
        let request = store.delete(ind);

        request.onsuccess = function(event) {
            callback();
        };

        request.onerror = function(event) {
            throw new Error("Unable to delete entry from "+p.tableName);
        }
    }
}

export default class IndexedDB {
    constructor(dbName, callback=()=>{}, baseSchema=[], debug=false){
        let dbInfo = localStorage.getItem(dbName);
        if (dbInfo)
            dbInfo = JSON.parse(dbInfo);
        else
            dbInfo = {version:1,schema:baseSchema};
        localStorage.setItem(dbName, JSON.stringify(dbInfo));

        const p = this._private = {
            debug,
            dbName,
            schema: [],
            version: 0,
            tables: [],
            ...dbInfo
        };

        const me = this;

        this.setupDB(callback);
    }

    getDB(){
        return this._private.db;
    }

    setupDB(callback=()=>{},upgradeOnly=false) {
        const p = this._private;
        const me = this;
        let dbInfo = JSON.parse(localStorage.getItem(p.dbName));

        if (p.db)
            p.db.close();
        p.db = window.indexedDB.open(p.dbName, dbInfo.version);

        p.db.onerror = function(event) {
            // do nothing
        };

        p.db.onsuccess = function(event) {
            p.db = event.target.result;

            let dbInfo = JSON.parse(localStorage.getItem(p.dbName));
            window.setTimeout(()=>{
                me.setupRefs();
                if (!upgradeOnly)
                    callback();
            },1000);
        };

        p.db.onupgradeneeded = function(event) {
            let db = event.target.result;
            let dbInfo = JSON.parse(localStorage.getItem(p.dbName));

            // remove old tables
            p.schema.filter(oldTable=>{
                return dbInfo.schema.reduce((aggr,newTable)=>{
                    return aggr && newTable.name != oldTable.name;
                },true);
            }).forEach(table=>{
                db.deleteObjectStore(table.name);
            });

            // create new tables
            dbInfo.schema.filter(newTable=>{
                return p.schema.reduce((aggr,oldTable)=>{
                    return aggr && newTable.name != oldTable.name;
                },true);
            }).forEach(table=>{
                db.createObjectStore(table.name);
            });

            p.version = dbInfo.version;
            p.schema = dbInfo.schema;
            p.db = db;

            me.setupRefs();
            window.setTimeout(callback,10);
        };
    }

    setupRefs() {
        const p = this._private;

        p.tables.forEach(table=>{
            if (this.hasOwnProperty(table.name))
                delete(this[table.name]);
        });
        p.tables = [];

        p.schema.forEach((table=>{
            p.tables[table.name] = new IndexedDBTable(table.name,this.getDB.bind(this));
            if (!this[table.name])
                this[table.name] = p.tables[table.name];
        }).bind(this));
    }

    createTable(name, callback=()=>{}) {
        const p = this._private;
        const me = this;

        let dbInfo = JSON.parse(localStorage.getItem(p.dbName));
        if (dbInfo.schema.filter(table=>{
            return table.name == name;
        }).length) {
            callback();
            return;
        }

        dbInfo.version = dbInfo.version+1;
        dbInfo.schema.push({name});
        dbInfo.schema;
        localStorage.setItem(p.dbName, JSON.stringify(dbInfo));
        this.setupDB(callback,true);
    }

    removeTable(name, callback=()=>{}) {
        const p = this._private;
        const me = this;
        let dbInfo = JSON.parse(localStorage.getItem(p.dbName));

        dbInfo.version = dbInfo.version+1;
        dbInfo.schema = dbInfo.schema.filter(table=>{
            return table.name != name;
        });

        localStorage.setItem(p.dbName, JSON.stringify(dbInfo));
        this.setupDB(callback,true);
    }

    getTable(tableName) {
        return this._private.tables[tableName];
    }
}