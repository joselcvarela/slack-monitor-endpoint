// @ts-check

import axios from "axios";
import { CronJob } from "cron";

const { ENDPOINT, SLACK_CHANNEL_ID, SLACK_TOKEN, CRON, TIMEOUT } = process.env;

start();

function start() {
  if (!CRON) throw new Error("CRON must be defined");

  const job = new CronJob(CRON, run, null, true, "utc", null, true);
  console.log("Is running?", job.running);
}

async function run() {
  if (!ENDPOINT) throw new Error("ENDPOINT must be defined");
  if (!SLACK_CHANNEL_ID) throw new Error("SLACK_CHANNEL_ID must be defined");
  if (!SLACK_TOKEN) throw new Error("SLACK_TOKEN must be defined");

  const timeout = Number.isNaN(Number(TIMEOUT)) ? 4000 : Number(TIMEOUT);

  try {
    const urls = ENDPOINT.split(";").map((raw_url) => {
      const url = new URL(raw_url);
      url.searchParams.set("cache-buster", String(Date.now()));
      return url;
    });

    const status = await Promise.all(
      urls.map(async (url, i) => {
        return await axios
          .get(url.toString())
          .then((r) => {
            return r.status === 200;
          })
          .catch((r) => false);
      })
    );

    const online = status.flatMap((online, i) =>
      online === true ? urls[i] : []
    );
    const offline = status.flatMap((online, i) =>
      online === false ? urls[i] : []
    );

    if (online.length) {
      console.log(online.map((url) => `✅ ${url}`));
    }

    if (offline.length) {
      console.log(offline.map((url) => `⛔ ${url}`));

      await axios.post(
        "https://slack.com/api/chat.postMessage",
        {
          channel: SLACK_CHANNEL_ID,
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: [
                  ...offline.map((url) => `"Offline ⛔️" | Endpoint: ${url}`),
                ].join("\n"),
              },
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${SLACK_TOKEN}`,
          },
          timeout,
        }
      );
    }
  } catch (err) {
    console.error(err);
    throw err;
  }
}
