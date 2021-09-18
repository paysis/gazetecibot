import setThreads from "../util/threads/setThreads.js";
import deployCommands from "../util/deployCommands.js";
import getGuild from "../util/getGuild.js";
import addThreadProcess, {
  initThreadProcess,
} from "../util/threads/threadQueue.js";

import { setIntervalAsync } from "set-interval-async/dynamic";

export default async function ready(client) {
  console.log(`${client.user.tag} is ready.`);

  initThreadProcess(client);

  await deployCommands(client, (await getGuild(client)).id);

  addThreadProcess(setThreads, true);

  const setThreadInterval = setIntervalAsync(async () => {
    addThreadProcess(setThreads, true);
  }, 2 * 60 * 1000);
}

export const name = "ready";
export const once = true;
export const async = true;
