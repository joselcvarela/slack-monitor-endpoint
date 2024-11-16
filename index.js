import axios from "axios";
import { CronJob } from "cron";

async function run() {
  try {
    const url_list = process.env.ENDPOINT.split(";");

    const online = await Promise.all(
      url_list.map(async (raw_url, i) => {
        const url = new URL(raw_url);
        url.searchParams.set("cache-buster", Date.now());

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
                    `${online ? "Online ✅" : "Offline ⛔️"} | Endpoint: ${url_list[i]}`
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
