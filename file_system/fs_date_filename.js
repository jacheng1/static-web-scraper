// Date pattern for filenames
// Useful for manipulating data w/ dates

const dayjs = require("dayjs");
const fs = require("fs");

const content = "some_text";

const date = dayjs();
const dateString = date.format("YYYYMMDD_HHmmss");

const filename = `test.${dateString}.txt`;
fs.writeFileSync(filename, `${dateString}: ${content}`);
const newContent = fs.readFileSync(filename);
console.log(newContent.toString());