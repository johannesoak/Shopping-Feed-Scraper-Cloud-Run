"use strict";

// [START run_imageproc_handler_setup]
const fs = require("fs");
const { promisify } = require("util");
const path = require("path");

const { Storage } = require("@google-cloud/storage");
const storage = new Storage();

// [START run_imageproc_handler_analyze]
// Blurs uploaded images that are flagged as Adult or Violence.
exports.startScraping = async (event) => {
  // This event represents the triggering Cloud Storage object.
  const object = event;

  const scrapeList = await downloadScrapeList(object).catch((err) => {
    console.error(`Failed to download the scrape list`, err);
    throw err;
  });

  // Scraping
  try {
    if (scrapeList.length > 0) {
      // The new scrape list that gets emptied or re-uploaded to the storage
      const newScrapeList = [];

      // Loops the scrape list
      scrapeList.forEach((item, i) => {
        if (i < 5) {
          newScrapeList.push(item);
        }
      });
    }
  } catch (err) {
    console.error(`Failed to scrape the list.`, err);
    throw err;
  }

  // Re-upload the new scrape list if exist
  if (newScrapeList) {
  try {
     
    // Upload the list
    console.log("Uploading the new Scrape List");
    const scrapeListJSON = JSON.stringify(newScrapeList);
    uploadScrapeList(scrapeListJSON, object);

    // If the new list is empty - Then remove team from Scrape Queue
    if (newScrapeList.length == 0) {}

    
  } catch (err) {
    console.error(`Failed to scrape the list.`, err);
    throw err;
  }} 
  // Else remove team from Scrape Queue
  else {}
};

// Re-upload the scrape list so it can be used again
const uploadScrapeList = async (scrapeListJSON, object) => {
  const bucketName = object.teamId.toLowerCase();
  const destinationName = object.feedId.toLowerCase() + "scrape_list.json";
  const bucket = storage.bucket(bucketName);
  const bucketFile = bucket.file(destinationName);
  const options = {
    gzip: true,
    resumable: false,
    destination: destinationName,
    validation: "crc32c",
    metadata: {
      contentType: "application/json",
      cacheControl: "no-cache",
      metadata: {
        type: "Scrape List JSON",
      },
    },
  };

  bucketFile.save(scrapeListJSON, options).catch((err) => {
    error.callRollbar("error", err);
    return err;
  });
};

const downloadScrapeList = async (object) => {
  const bucketName = object.teamId.toLowerCase();
  const fileName = object.feedId.toLowerCase() + "scrape_list.json";

  // Get the Scrape List
  const file = storage.bucket(bucketName).file(fileName);

  const tempLocalPath = `/tmp/${path.parse(file.name).base}`;

  // Download file from bucket.
  try {
    await file.download({ destination: tempLocalPath });
    console.log(`Downloaded ${file.name} to ${tempLocalPath}.`);
  } catch (err) {
    throw new Error(`File download failed: ${err}`);
  }

  // Return the array
  return new Promise((resolve, reject) => {
    fs.readFile(tempLocalPath, (err, data) => {
      if (err) reject(err);
      let json = JSON.parse(data);
      // Delete the temporary file.
      const unlink = promisify(fs.unlink);
      unlink(tempLocalPath);
      resolve(json);
    });
  });
};
