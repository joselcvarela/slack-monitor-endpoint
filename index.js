import axios from "axios";
import { CronJob } from "cron";

async function run() {
  const online = await axios
    .get(process.env.ENDPOINT, {
      params: { "cache-buster": Date.now() },
    })
    .then((r) => {
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
            text: `Endpoint "${process.env.ENDPOINT}" ${online ? "Online ✅" : "Offline ⛔️"}`,
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
