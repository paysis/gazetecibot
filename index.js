import { Client, Intents } from "discord.js";
import fs from "fs";

const { token } = JSON.parse(fs.readFileSync("./config.json", "utf8"));

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MEMBERS,
    Intents.FLAGS.GUILD_PRESENCES,
    Intents.FLAGS.GUILD_MESSAGES,
  ],
});

const eventFiles = fs
  .readdirSync("./events")
  .filter((file) => file.endsWith(".js"));

for (const file of eventFiles) {
  const event = await import(`./events/${file}`);

  let cback;
  if (event.async) {
    cback = async (...args) => await event.default(client, ...args);
  } else {
    cback = (...args) => event.default(client, ...args);
  }

  if (event.once) {
    client.once(event.name, cback);
  } else {
    client.on(event.name, cback);
  }
}

client.login(token);
