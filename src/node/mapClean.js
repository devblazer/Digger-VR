var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017/digger_vr';

MongoClient.connect(url, function(err, db) {
    if (err) {
        console.log(err);
        return;
    }
    
    var gamesCollection = db.collection('games');
    gamesCollection.find({}).toArray((err,docs)=>{
        docs.forEach(doc=>{
            db.collection('map_'+doc.id).drop();
        });
        gamesCollection.drop();
        console.log('done');
    });
});