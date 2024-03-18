presets = [
  {
    first: 'Katherine',
    last: 'Tucker',
    amt: 4.32,
    cc_num: 4124871359871223,
    cat_id: 1,
    merchant: 'Brown PLC',
    street: '670 Le Meadows Suite 250',
    city: "Lakeland",
    state: "FL",
    zip: 33811,
    city_pop: "237282",
    dob: "1980-11-22",
    lat: "27.9865",
    long: "-82.0139"
  },
  {
    first: 'Mark',
    last: 'Tyler',
    amt: 47.51,
    cc_num: 8172766240981724,
    cat_id: 5,
    merchant: 'Ortiz Group',
    street: '82201 Bradley Radial Suite 703',
    city: "Avera",
    state: "GA",
    zip: 30803,
    city_pop: "741",
    dob: "1980-11-22",
    lat: "33.141",
    long: "-82.515"
  },
  {
    first: 'Jerry',
    last: 'Perkins',
    amt: 281.06,
    cc_num: 8937568289481742,
    cat_id: 2,
    merchant: 'Reily LLC',
    street: '053 Kim Valley Suite 928',
    city: "Old Hickory",
    state: "TN",
    zip: 1844,
    city_pop: "885",
    dob: "1988-09-15",
    lat: "35.9946",
    long: "-81.7266"
  },
  {
    first: 'Christie',
    last: 'Williamson',
    amt: 281.06,
    cc_num: 2641717646134453,
    cat_id: 3,
    merchant: 'Kerluke Inc',
    street: '519 Jerry Views',
    city: "Avoca",
    state: "IA",
    zip: 51521,
    city_pop: "2036",
    dob: "1971-08-20",
    lat: "41.4768",
    long: "-95.3509"
  }
];

merchants_lat_long = {
  'Reily LLC': {
    lat: "36.430124",
    long: "81.17948299999999"
  },
  'Brown PLC': {
    lat: "32.496728000000004",
    long: "-96.79266199999999"
  },
  'Ortiz Group': {
    lat: "41.58034",
    long: "-81.07938100000001"
  },
  'Kerluke Inc': {
    lat: "41.046356",
    long: "-96.051987"
  },
  'Schoen Ltd': {
    lat: "43.769333",
    long: "-75.150648"
  }
};

function loadPreset() {
  let presetId = document.getElementById('preset').value;
  if (presetId) {
    presetId = parseInt(presetId);
  }
  for (const [key, value] of Object.entries(presets[presetId])) {
    document.getElementById(key).value = value;
  }
}

function generateID(length) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}

function getFieldValue(fieldName) {
  const field = document.getElementById(fieldName);
  if (field) {
    return field.value;
  } else {
    console.log(`Error! Could not find the field ${fieldName}`);
    return "";
  }
}

function getMerchantLatLong(merchantName) {
  if (merchantName in merchants_lat_long) {
    return merchants_lat_long[merchantName];
  } else {
    console.log(`Error! No lat/long defined for merchant ${merchantName}`);
    return {
      lat: 0,
      long: 0
    };
  }
}

function showMessage(message, type) {
  const messages = document.getElementById('messages');
  const wrapper = document.createElement('div');
  wrapper.innerHTML = [
    `<div class="alert alert-${type} alert-dismissible" role="alert">`,
    `   <div>${message}</div>`,
    '   <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>',
    '</div>'
  ].join('');

  messages.append(wrapper);
}

async function doTransaction() {
  const date = new Date();
  const year = date.getFullYear();
  const month = ('0' + (date.getMonth() + 1)).slice(-2);
  const day = ('0' + date.getDate()).slice(-2);
  const hour = ('0' + date.getHours()).slice(-2);
  const minute = ('0' + date.getMinutes()).slice(-2);
  const second = ('0' + date.getSeconds()).slice(-2);
  const formattedDate = `${year}-${month}-${day} ${hour}:${minute}:${second}`;

  const merchant_lat_long = getMerchantLatLong(getFieldValue('merchant'));

  const data = {
    trans_date_trans_time: formattedDate,
    month: month,
    day: day,
    hour: hour,
    cc_num: getFieldValue('cc_num'),
    merchant: 'fraud_' + getFieldValue('merchant'),
    // category: getFieldValue('cat_id'),
    cat_id: getFieldValue('cat_id'),
    amt: getFieldValue('amt'),
    first: getFieldValue('first'),
    last: getFieldValue('last'),
    street: getFieldValue('street'),
    city: getFieldValue('city'),
    state: getFieldValue('state'),
    zip: getFieldValue('zip'),
    lat: getFieldValue('lat'),
    long: getFieldValue('long'),
    city_pop: getFieldValue('city_pop') ? getFieldValue('city_pop') : Math.round(Math.random()*1000000).toString(),
    dob: getFieldValue('dob'),
    trans_num: generateID(20),
    unix_time: Math.round(date.getTime() / 1000).toString(),
    merch_lat: merchant_lat_long.lat,
    merch_long: merchant_lat_long.long,
  };
  // console.log(data);
  dataStr = JSON.stringify(data);
  
  try {
    const response = await fetch('http://127.0.0.1:8889/initiate/txn', {
      method: 'post',  
      headers: {
        'Content-Type': 'application/json'
      },
      body: dataStr
    });

    response_json = await response.json();
    // console.log(response_json);
    
    if(response_json.txn_status == "REJECTED") {
      const message = `Your transaction was rejected! Please get in touch with customer support for further details!<br/>Score: ${response_json.prediction}`;
      showMessage(message, 'danger');
      console.log('REJECTED', message);
    } else if(response_json.txn_status == "AUTHORIZED") {
      const message = `$${data.amt} is successfully credited<br/>Score: ${response_json.prediction}`;
      showMessage(message, 'success');
      console.log('AUTHORIZED', message);
    } else {
      const message = 'Something went wrong!';
      showMessage(message, 'warning');
      console.log('FAILED', message);
    }
    
  } catch (error) {
    console.error(error);
  }
}