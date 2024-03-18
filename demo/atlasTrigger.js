exports = async function(changeEvent) {
  const fullDocument = changeEvent.fullDocument;
  
  const body = { "instances": [fullDocument] };
  // console.log(JSON.stringify(body));
  
  context.http.post({
    url: "<URL>",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": ["application/json"],
      "Authorization": ["Basic <token>"]
    }
  }).then(response => {
    const ejson_body = JSON.parse(response.body.text());
    // console.log(JSON.stringify(ejson_body));
    const prediction = ejson_body['predictions'];
    
    if (prediction && prediction.length > 0 && Number.isFinite(prediction[0])) {
      userDoc = {
        "txn_num": fullDocument['trans_num'],
        "timestamp": new Date(),
        "prediction": prediction[0]
      };
      
      if (prediction && prediction.length > 0 && prediction[0] >= 0.5) {
        userDoc['txn_status'] = "REJECTED";
      } else if (prediction && prediction.length > 0 && prediction[0] < 0.5) {
        userDoc['txn_status'] = "AUTHORIZED";
      } else {
        userDoc['txn_status'] = "FAILED";
      }
      console.log(`Transaction ${userDoc['txn_status']}: ${prediction}`);
      
      const mongodb = context.services.get("MyCluster");
      const users = mongodb.db("fraud-detection").collection("txn_status");
      users.insertOne(userDoc);
      
      const message = `Processed ${userDoc['txn_num']} with score: ${prediction[0]}`;
      console.log(message);
      return message;
    }
  });
};