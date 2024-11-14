# Slack Monitor Endpoint

This tool allows you to ping an endpoint and receive Slack notifications.
See [here](https://api.slack.com/tutorials/tracks/posting-messages-with-curl) how to create a Slack app to get a token

# Usage

The easiest way to use is to create a `docker-compose.yaml` file with the following:

```yaml
services:
  monitor:
    image: joselcvarela/slack-monitor-endpoint:1.0.0
    environment:
      ENDPOINT: "https://example.com"
      SLACK_CHANNEL_ID: "C0XXXXXXXXX"
      SLACK_TOKEN: "xoxb-XXXXXXXXXXXXX-XXXXXXXXXXXXX-XXXXXXXXXXXXXXXXXXXXXXXX"
      CRON: "0 */30 * * * *"
```

The `CRON` parameter should be set including seconds
