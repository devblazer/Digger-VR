var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017/digger_vr';

MongoClient.connect(url, function(err, db) {
    if (err) {
        console.log(err);
        return;
    }
    var usersCollection = db.collection('users');
    usersCollection.insert(
        {id:'asdfghjk',username:'devblazer',password:'tequ!la:)isgood',salt:'asdfghjkasdfghjkasdfghjkasdfghjk'},
        err=>{
            if (err) {
                console.log(err);
                return;
            }
            usersCollection.find({}).toArray((err,docs)=>{
                if (err) {
                    console.log(err);
                    return;
                }
                console.log(docs);
                db.close();
            });
        }
    );
});