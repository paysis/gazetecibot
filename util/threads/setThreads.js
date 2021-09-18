import getGuild from "../getGuild.js";
import getThreadList, { getEntry } from "../eksi/eksiThreadEntries.js";
import sleep from "../sleep.js";
import constructEntry from "../eksi/constructMessage.js";
import forEachAsync from "../forEachAsync.js";
import { addExistingThreads, getExistingThreads } from "./threadQueue.js";

export default async function setThreads(client) {
  const myGuild = await getGuild(client);

  const channels = await myGuild.channels.fetch();

  const gundemChannel = channels
    .filter((channel) => channel.name.toLowerCase() === "gündem")
    .first();

  if (!gundemChannel) {
    return;
  }
  const eksiList = await getThreadList();

  const normalThreadManager = (
    await gundemChannel.threads.fetch({ active: true }, { force: true })
  ).threads;

  await sleep(5000);

  const archivedThreadManager = (
    await gundemChannel.threads.fetch(
      { archived: { fetchAll: true, type: "public" } },
      { force: true }
    )
  ).threads;

  const fullThreadManager = normalThreadManager.concat(archivedThreadManager);

  // hard-coded ass savior -> deletes all threads in gündem
  //fullThreadManager.map(async (thread) => await thread.delete());
  //return;

  addExistingThreads(...fullThreadManager.map((thread) => thread.name));

  await forEachAsync(eksiList, async (item) => {
    if (!getExistingThreads().includes(String(item.title))) {
      let messageObj = {};
      try {
        while (true) {
          const eksiInfo = await getEntry(item.slug).catch(console.error);

          if (eksiInfo.hasOwnProperty("error")) {
            await sleep(1800);
            continue;
          }
          messageObj.msg = constructEntry(
            item.title,
            eksiInfo.body,
            eksiInfo.linkToPage,
            eksiInfo.author,
            eksiInfo.date
          );

          messageObj.embed = true;

          break;
        }
      } catch (err) {
        messageObj.msg = `"${item.title}" başlığı ${item.entry_count} entry barındırıyor.`;
        messageObj.embed = false;
        console.error(err);
      }

      const newThreadChannel = await gundemChannel.threads.create({
        name: item.title,
      });

      addExistingThreads(...[item.title, newThreadChannel.name]);

      await newThreadChannel.send(
        messageObj.embed ? { embeds: [messageObj.msg] } : messageObj.msg
      );

      await sleep(200);
    }
  });
}
