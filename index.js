// @ts-check

import axios from "axios";
import { CronJob } from "cron";

const {
  NODE_ENV,
  RETRIES,
  ENDPOINT,
  SLACK_CHANNEL_ID,
  SLACK_TOKEN,
  CRON,
  TIMEOUT,
} = process.env;

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
  const retries = Number.isNaN(Number(RETRIES)) ? 3 : Number(RETRIES);

  try {
    const urls = ENDPOINT.split(";").map((raw_url) => {
      const url = new URL(raw_url);
      url.searchParams.set("cache-buster", String(Date.now()));
      return url;
    });

    const status = await Promise.all(
      urls.map((url) => ping(url, { timeout, retries }))
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

      if (NODE_ENV !== "development") {
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
          }
        );
      }
    }
  } catch (err) {
    console.error(err);
    throw err;
  }
}

/**
 *
 * @param {URL} url
 * @param {object} [options]
 * @param {number} [options.retries]
 * @param {number} [options.timeout]
 */
async function ping(url, options, count = 0) {
  count += 1;

  if (options?.retries && count > options.retries) {
    return false;
  }

  if (count > 1) {
    await new Promise((res) => setTimeout(res, count * 2000));
  }

  const timeout = (options?.timeout || 1000) + count * 1000;

  return await axios
    .get(url.toString(), { timeout })
    .then((r) => {
      return r.status === 200;
    })
    .catch((r) => (options?.retries ? ping(url, options, count) : false));
}
