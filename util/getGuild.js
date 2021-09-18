import fs from "fs";
const { guildID } = JSON.parse(fs.readFileSync("./config.json", "utf8"));

export default async function getGuild(client) {
  const guildList = await client.guilds.fetch();

  return guildList.get(guildID).fetch();
}
