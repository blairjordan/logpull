const fs = require("fs");
const path = require("path");
const flatten = require("flat");
const { Settings, MessageSchema } = require("./config.json");

const logPath = "./logs";

const nested = (obj, schema) => schema.split(".").reduce((prev, curr) => {
    prev = prev[curr];
    return prev;
}, obj);

const writeObjToFile = (input, output) => {
    const filename = path.join(logPath, input);
    const obj = JSON.parse(fs.readFileSync(filename, "utf8"));
    const record = { ...flatten(nested(obj, MessageSchema.ROOT), { delimiter: "_" }), timestamp: obj.timestamp };
    let line = `${MessageSchema.PREPEND_FILENAME ? `${filename},` : ""}`;
    MessageSchema.FIELDS.forEach((f, i) => {
        line += (typeof (record[f]) !== "undefined") ? `"${record[f].toString().replace(/\"/g,"\"\"")}"` : "";
        if (i < MessageSchema.FIELDS.length - 1)
            line += ",";
    });
    fs.appendFile(output, `${line}\n`, function (err) {
        if (err) throw err;
    });
};

fs.writeFile(Settings.COMBINED_PATH, `${MessageSchema.PREPEND_FILENAME ? "filename," : ""}${MessageSchema.FIELDS.join(",")}\n`, { encoding: "utf8", flag: "w" }, (err) => {
    if (err)
        throw err;
    fs.readdir(logPath, (err, files) => {
        if (err)
            throw err;
        files.forEach(file => {
            writeObjToFile(file, Settings.COMBINED_PATH)
        });
    });
});
