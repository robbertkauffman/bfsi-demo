#  BFSI Transaction Simulator Demo
This is a simple HTML web form to simulate legitimate and fraudulent transactions that are classified by an AI model trained in Databricks.

## Prerequisites
Before running the app, you'll need to have the following installed on your system:
- Python 3
- pip3

## Deploy Atlas cluster & import data
- If you do not have an Atlas cluster set up yet, create one. For this demo, a free-tier cluster suffices. See [Get Started with Atlas](https://www.mongodb.com/docs/atlas/getting-started/) for instructions on how to create an account and cluster.
- Download the [training data](https://drive.google.com/file/d/1gx7DOxJA8OwjoJVeWGtdQwZP0StAnoeF/view?usp=sharing), unzip, and either import using *Compass* or *mongoimport*:
    - A. Using [Compass](https://www.mongodb.com/try/download/compass), follow the instructions from [Import Data](https://www.mongodb.com/docs/compass/current/import-export/) and import to database *fraud-detection* and collection *txn-data*. Make sure to use *string* as the type for ALL the fields, including any float, integer or timestamp fields.
    - B. Using `mongoimport` (include either the username in the connection string or specify with `--username <DB_USER>`):
        ```bash
        mongoimport --uri <MONGO_CONN_STRING> --db "fraud-detection" --collection "txn-data" --type csv --file fraudTrain.csv --columnsHaveTypes --fields=".string(),trans_date_trans_time.string(),cc_num.string(),merchant.string(),category.string(),amt.string(),first.string(),last.string(),gender.string(),street.string(),city.string(),state.string(),zip.string(),lat.string(),long.string(),city_pop.string(),job.string(),dob.string(),trans_num.string(),unix_time.string(),merch_lat.string(),merch_long.string(),is_fraud.string()"
        ```

## Train ML Models
If you haven't trained the ML models yet, please follow these steps:
- Create a compute instance in Databricks with the following requirements:
    - Spark 3.1.x - 3.3.x (Spark 3.5.x support coming soon)
    - Install library via maven: `org.mongodb.spark:mongo-spark-connector_2.12:10.2.1`
    - Install library via PyPi: `databricks-feature-store`
 - Import & run notebook for loading & processing the training data: [Fraud_demo_data_transform.ipynb](/BFSI/notebooks/Fraud_demo_data_transform.ipynb)
    - Update line 5 with the connection string of your Mongo cluster. Make sure to include the username & password in the connection string, e.g. *mongodb+srv://username:password@clustername.projecthash.mongodb.net/fraud-detection*.
 - Import & run notebook for training the XGB model: [[Fraud_demo_model_training.ipynb](/BFSI/notebooks/Fraud_demo_model_training.ipynb)]
 - Set up a Serving Endpoint for the trained model and create an Access Token for authenticating to the endpoint. The URL and token is used in the next step.

## Setup Atlas Trigger
- [Create an Atlas Trigger](https://www.mongodb.com/docs/atlas/app-services/triggers/database-triggers/#create-a-database-trigger) and configure it as follows:
    - Link Data Source: link to your Atlas cluster
    - Watch Against: Collection
    - Cluster Name: select your Atlas cluster
    - Database Name: *fraud-detection*
    - Collection Name: *txn-data-stream* (if not listed, select Create New Option from the dropdown)
    - Operation Type: Insert Document
    - Full Document: enabled/true
    - Function: copy + paste the code from [atlasTrigger.js](/demo/atlasTrigger.js)
        - Update the URL on line 8 to point to the Databrick Serving Endpoint of the model that was trained earlier
        - Update the authorization token for Databricks in line 12

## Deploy the Backend Service
- Clone this GitHUb repo:
    ```bash
    git clone https://github.com/robbertkauffman/bfsi-demo.git
    ```
- Update the MongoDB Connection String in line 13 of `demo/backend-service/serve.py`. Make sure it includes the database username and password.
- Install the project dependencies using *pip*:
    ```
    cd demo/backend-service
    pip3 install -r req.txt
    ```
- Run the Python code:
    ```
    python3 serve.py
    ```

## Running the App
- Open the file `demo/web-app/index.html` in your browser.
- If this doesn't work, you can setup a simple webserver using:
    ```
    cd demo/web-app
    python3 -m http.server 8000
    ```
    And open `http://localhost:8000/index.html` in your browser.