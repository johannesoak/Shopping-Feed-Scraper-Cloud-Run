// Copyright 2020 Google LLC. All rights reserved.
// Use of this source code is governed by the Apache 2.0
// license that can be found in the LICENSE file.

// [START run_pubsub_server_setup]
const express = require('express');
const bodyParser = require('body-parser');
const app = express();

const engine = require("./scraper/main")

app.use(bodyParser.json());
// [END run_pubsub_server_setup]

// [START run_pubsub_handler]
app.post('/', async (req, res) => {
  if (!req.body) {
    const msg = 'no Pub/Sub message received';
    console.error(`error: ${msg}`);
    res.status(400).send(`Bad Request: ${msg}`);
    return;
  }
  if (!req.body.message || !req.body.message.data) {
    const msg = 'invalid Pub/Sub message format';
    console.error(`error: ${msg}`);
    res.status(400).send(`Bad Request: ${msg}`);
    return;
  }

  // Decode the Pub/Sub message.
  const body = req.body.message;
  let data;
  try {
    data = createObject(body)
    .catch(err => {throw new Error(err)})
  } catch (err) {
    const msg =
      'Invalid Pub/Sub message: data property is not valid base64 encoded JSON';
    console.error(`error: ${msg}: ${err}`);
    res.status(400).send(`Bad Request: ${msg}`);
    return;
  }

  // Run the scraper
  try {
    await engine.startScraping(data);
    res.status(204).send();
  } catch (err) {
    console.error(`error: Blurring image: ${err}`);
    res.status(500).send();
  }
});

module.exports = app;
// [END run_pubsub_handler]


function createObject(body) {
  return new Promise((resolve, reject) => {
    try {
      // Feed ID
      const feedId = event.attributes.feedid
      // const feedId = "3i0jbtuliw0h69winayd"

      // Team ID
      const teamId = event.attributes.teamid
      //const teamId = "shopping-feed-enhancer"

      // Data
      const data = Buffer.from(body.data, 'base64').toString().trim()

      const object = {
        feedid: feedId,
        teamid: teamId,
        data: JSON.parse(data),
        startDate: new Date()
      }
      resolve(object)
    }
    catch (err) {
      reject(err)
    }
  })
}