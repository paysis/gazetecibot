import getGuild from "../getGuild.js";
import sleep from "../sleep.js";
import forEachAsync from "../forEachAsync.js";
import { removeExistingThread } from "./threadQueue.js";

export default async function clearThreads(client) {
  const myGuild = await getGuild(client);

  const channels = await myGuild.channels.fetch();

  const gundemChannel = channels
    .filter((channel) => channel.name.toLowerCase() === "gündem")
    .first();

  if (!gundemChannel) {
    return;
  }
  const normalThreadManager = (
    await gundemChannel.threads.fetch({ active: true }, { force: true })
  ).threads;

  await sleep(3000);

  const archivedPublicThreadManager = (
    await gundemChannel.threads.fetch(
      { archived: { fetchAll: true, type: "public" } },
      { force: true }
    )
  ).threads;

  await sleep(3000);

  const archivedPrivateThreadManager = (
    await gundemChannel.threads.fetch(
      { archived: { fetchAll: true, type: "private" } },
      { force: true }
    )
  ).threads;

  const fullThreadManager = normalThreadManager.concat(
    archivedPublicThreadManager,
    archivedPrivateThreadManager
  );

  let fullThreadManagerArr = fullThreadManager.map((thread) => thread);

  await forEachAsync(fullThreadManagerArr, async (thread) => {
    removeExistingThread(thread.name);
    await thread.delete();
  });
}
