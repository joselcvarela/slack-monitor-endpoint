import axios from "axios";
import { CronJob } from "cron";

async function run() {
  const url = new URL(process.env.ENDPOINT);
  url.searchParams.set("cache-buster", Date.now());

  const online = await axios.get(url.toString()).then((r) => {
    return r.status === 200;
  });

  await axios.post(
    "https://slack.com/api/chat.postMessage",
    {
      channel: process.env.SLACK_CHANNEL_ID,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `Endpoint "${url.toString()}" ${online ? "Online ✅" : "Offline ⛔️"}`,
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
}

const job = new CronJob(process.env.CRON, run, null, true, "utc", null, true);
console.log("Is running?", job.running);
