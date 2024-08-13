const axios = require("axios");
const cheerio = require("cheerio");

const url = "https://www.libertyharbor.com/availability/";

axios.get(url).then((response) => {
    const result = [];
    const $ = cheerio.load(response.data);

    $("table tbody tr").each((index, element) => {
        const columns = $(element).find("td");
        const listing = {
            building: $(columns[0]).text().trim(),
            resident: $(columns[1]).text().trim(),
            beds: $(columns[2]).text().trim(),
            baths: $(columns[3]).text().trim(),
            sqft: $(columns[4]).text().trim(),
            price: $(columns[5]).text().trim(),
        };

        result.push(listing);
    });

    console.log(JSON.stringify(result, null, 2));
});