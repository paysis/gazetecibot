import { SlashCommandBuilder } from "@discordjs/builders";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import fs from "fs";

const { token } = JSON.parse(fs.readFileSync("./config.json", "utf8"));

const commands = [
  new SlashCommandBuilder()
    .setName("temizle")
    .setDescription("Gündem kanalındaki tüm başlıkları siler."),
  new SlashCommandBuilder()
    .setName("yenile")
    .setDescription(
      "Gündem kanalındaki başlıkları silmeden daha önce oluşturulmadıysa oluşturur."
    ),
].map((command) => command.toJSON());

export default async function deployCommands(client, guildID) {
  const rest = new REST({ version: "9" }).setToken(token);

  try {
    await rest.put(Routes.applicationGuildCommands(client.user.id, guildID), {
      body: commands,
    });

    console.log("Successfully registered application commands");
  } catch (err) {
    console.error(err);
  }
}
