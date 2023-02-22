import WebSocket from "ws";

class TwitchBot {
  private ws!: WebSocket;
  private oauthToken!: string;
  private username!: string;
  private channel!: string;

  constructor() {
    this.ws = new WebSocket("wss://irc-ws.chat.twitch.tv:443");

    this.ws.on("error", (error) => {
      console.error(`WebSocket error: ${error}`);
    });
  }

  public options(options: {
    oauthToken: string;
    username: string;
    channel: string;
  }) {
    this.oauthToken = options.oauthToken;
    this.username = options.username;
    this.channel = options.channel;
  }

  public connect() {
    this.ws.on("open", () => {
      // Authentication
      this.ws.send(`PASS ${this.oauthToken}`);
      this.ws.send(`NICK ${this.username}`);
      this.ws.send(`JOIN #${this.channel}`);
      this.ws.send(`CAP REQ :twitch.tv/tags`);
    });

    this.ws.on("error", (error) => {
      console.error(`WebSocket error: ${error}`);
    });
  }

  public disconnect() {
    this.ws.close();
  }

  public reconnect() {
    this.disconnect();
    this.connect();
  }

  public onMessage(
    callback: (
      message: string,
      username: string,
      channel: string,
      tags: any
    ) => void
  ) {
    this.ws.on("message", (data) => {
      const message = data.toString();
      const [tagsString, messagePartsString] = message.includes(" PRIVMSG ")
        ? message.split(" PRIVMSG ")
        : [null, message];
      const messageParts = messagePartsString.split(" ");
      const usernameMatch = messageParts[0].match(/^:([^!]+)/);
      const username = usernameMatch ? usernameMatch[1] : null;
      const channel = messagePartsString.split(" ")[0];
      const messageText = messageParts.slice(1).join(" ").substr(1);

      // Parse user state tags
      const tags: any = {};
      if (tagsString && tagsString.startsWith("@")) {
        const rawTags = tagsString.slice(1).split(";");
        for (const rawTag of rawTags) {
          const [key, value] = rawTag.split("=");
          tags[key] = value;
        }
      }

      callback(messageText, username!, channel, tags);
    });
  }

  public onConnected(callback: () => void) {
    this.ws.on("open", () => {
      callback();
    });
  }

  public say(message: string) {
    this.ws.send(`PRIVMSG #${this.channel} :${message}`);
  }

  public whisper(username: string, message: string) {
    this.ws.send(`PRIVMSG #jtv :/w ${username} ${message}`);
  }
}

export { TwitchBot };
