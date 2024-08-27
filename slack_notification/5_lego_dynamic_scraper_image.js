// Incomplete

const puppeteer = require("puppeteer");
const fs = require("fs");
const { stringify } = require("csv-stringify/sync");
const dayjs = require("dayjs");
const slackIncomingWebhookUrl = require("./slack_notification_url");

async function main() {
  try {
    const url = "https://www.lego.com/en-us/themes/star-wars";
    console.log(`Fetching data from: ${url}`);

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Wait for the required content to load
    await page.waitForSelector(".ProductGridstyles__ProductListItem-sc-1jftjwh-0");

    // Extract data
    const result = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll(".ProductGridstyles__ProductListItem-sc-1jftjwh-0"));
      return items.map(item => {
        const name = item.querySelector(".ProductLeafSharedstyles__Title-sc-1m6bmb5-3")?.innerText.trim() || '';
        const price = item.querySelector(".ProductPricestyles__PriceText-sc-1i9fbo5-1")?.innerText.trim() || '';
        const imageUrl = item.querySelector(".ProductImagestyles__ProductImage-sc-1d9l3y5-0")?.src || '';

        return { name, price, imageUrl };
      });
    });

    await browser.close();

    if (result.length === 0) {
      throw new Error("No items found on the page. The page structure might have changed.");
    }

    const output = stringify(result, { header: true, quoted: true });
    const date = dayjs();
    const dateString = date.format("YYYYMMDD_HHmmss");
    const filename = `lego_star_wars_products.${dateString}.csv`;
    fs.writeFileSync(filename, output);
    console.log(`Data saved to ${filename}`);

    await sendSlackNotification(result);
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}

async function sendSlackNotification(currEntries) {
  try {
    if (!slackIncomingWebhookUrl || typeof slackIncomingWebhookUrl !== 'string') {
      throw new Error('Invalid Slack webhook URL');
    }

    // Import fetch dynamically
    const { default: fetch } = await import('node-fetch');

    // Prepare Slack notification
    const blocks = [
      ...currEntries.map((entry) => {
        const { name, price, imageUrl } = entry;

        return {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*${name}*\nPrice: ${price}`,
          },
          accessory: {
            type: "image",
            image_url: imageUrl,
            alt_text: name,
          },
        };
      }),
    ];

    const slackData = {
      text: `Lego Star Wars data received`,
      blocks: blocks,
    };

    // Send Slack notification
    console.log(`Sending notification to Slack webhook: ${slackIncomingWebhookUrl}`);
    const response = await fetch(slackIncomingWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(slackData),
    });

    console.log(`Slack notification response status: ${response.status}`);
    console.log(`Slack notification response status text: ${response.statusText}`);

    if (response.status !== 200) {
      throw new Error(`Failed to send notification: ${response.status} ${response.statusText}`);
    }

    console.log(`Slack notification sent successfully`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}

main();
