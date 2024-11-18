// @ts-check

import axios from "axios";
import { CronJob } from "cron";

async function run() {
  try {
    const urls = process.env.ENDPOINT.split(";").map((raw_url) => {
      const url = new URL(raw_url);
      url.searchParams.set("cache-buster", Date.now());
      return url;
    });

    const online = await Promise.all(
      urls.map(async (url, i) => {
        return await axios
          .get(url.toString())
          .then((r) => {
            return r.status === 200;
          })
          .catch((r) => false);
      })
    );

    await axios.post(
      "https://slack.com/api/chat.postMessage",
      {
        channel: process.env.SLACK_CHANNEL_ID,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: [
                online.map((online) => (online ? "✅" : "⛔️")).join(" ") +
                  "⤵️",

                ...online.map(
                  (online, i) =>
                    `${online ? "Online ✅" : "Offline ⛔️"} | Endpoint: ${urls[i]}`
                ),
              ].join("\n"),
            },
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.SLACK_TOKEN}`,
        },
      }
    );
  } catch (err) {
    console.error(err);
    throw err;
  }
}

const job = new CronJob(process.env.CRON, run, null, true, "utc", null, true);
console.log("Is running?", job.running);
