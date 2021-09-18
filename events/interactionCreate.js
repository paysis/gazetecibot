import { Permissions } from "discord.js";
import setThreads from "../util/threads/setThreads.js";
import clearThreads from "../util/threads/clearThreads.js";
import addThreadProcess from "../util/threads/threadQueue.js";

export default async function interactionCreate(client, interaction) {
  if (!interaction.isCommand() || !interaction.inGuild()) return;

  const { commandName } = interaction;

  if (
    !interaction.member.permissions.has([
      Permissions.FLAGS.MANAGE_CHANNELS,
      Permissions.FLAGS.MANAGE_THREADS,
    ])
  ) {
    await interaction.reply(`Çık git yaşınla muhattap ol.`);
    return;
  }

  switch (commandName) {
    case "temizle":
      addThreadProcess(clearThreads, true);
      await interaction.reply(`Temizlenecek.`);
      break;
    case "yenile":
      addThreadProcess(setThreads, true);
      await interaction.reply(`Yenilenecek.`);
      break;
    default:
      return;
  }
}

export const name = "interactionCreate";
export const once = false;
export const async = true;
