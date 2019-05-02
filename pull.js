const fs = require("fs");
const path = require("path");
const axios = require("axios");
const process = require("process");
const { User, Loggly, Settings } = require("./config.json");

if (![5, 6].includes(process.argv.length)) {
    console.log(`Incorrect number of arguments.\nUsage:\nnode pull.js -7d now "*" [-v]`);
    return -1;
}

const SEARCH_URI = `http://${User.CUSTOMER_SUBDOMAIN}.loggly.com/apiv2/search?q=QUERY&from=FROM&until=TO&size=${Loggly.RECORDS_PER_PAGE}`;
const EVENTS_URI = `http://${User.CUSTOMER_SUBDOMAIN}.loggly.com/apiv2/events?rsid=RSID&page=PAGE`;

const verbose = ((process.argv.length === 6) && (process.argv[5] === "-v"));

if (!fs.existsSync(Settings.LOG_DIR)) {
    fs.mkdirSync(Settings.LOG_DIR);
}

const options = {
    headers: { "Authorization": `bearer ${User.API_TOKEN}` },
    responseType: "json"
};

const getRsid = (opts) => {
    const { from, to, query } = opts;
    const searchUri = SEARCH_URI
        .replace("FROM", from)
        .replace("TO", to)
        .replace("QUERY", query);

    return axios({
        method: "get",
        url: searchUri,
        ...options
    })
        .then(function (response) {
            return response.data.rsid.id;
        })
        .catch(function (error) {
            console.log(error);
        });
};

const getEvents = (opts, cb) => {
    const { rsid, page } = opts;
    const eventsUri = EVENTS_URI
        .replace("RSID", rsid)
        .replace("PAGE", page);

    return axios({
        method: "get",
        url: eventsUri,
        ...options
    })
        .then(function (response) {
            cb(response.data);
            return { rsid, data: response.data };
        })
        .catch(function (error) {
            console.log(error.response.data.message);
        });
};

const writeLog = (obj) => {
    obj.events.forEach(e => {
        const fpath = path.join(Settings.LOG_DIR, `${e.timestamp}_${e.id}.json`);
        if (!fs.existsSync(fpath)) {
            fs.writeFile(fpath, JSON.stringify(e), "utf8", (err) => {
                if (err)
                    console.log(err);

                if (verbose)
                    console.log(`Writing ${fpath}`);
            });
        } else {
            if (verbose)
                console.log(`${fpath} already exists. Skipping.`)
        }
    });
};

getRsid({ from: process.argv[2], to: process.argv[3], query: process.argv[4].replace(`"`, "") }).then(rsid => {
    return getEvents({ rsid, page: 0 }, writeLog);
}).then(events => {
    const { rsid, data } = events;

    if (data.total_events > Loggly.MAX_RECORDS_PER_QUERY)
        console.log("Warning: Total record count exceeds maximum result limit per query.");

    for (let page = 1; page < Math.ceil(data.total_events / Loggly.RECORDS_PER_PAGE); page++) {
        if (verbose)
            console.log(`Fetching page ${page}`);

        getEvents({ rsid, page }, writeLog);
    }
});
