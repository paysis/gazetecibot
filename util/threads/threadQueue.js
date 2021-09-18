import {
  setIntervalAsync,
  clearIntervalAsync,
} from "set-interval-async/dynamic"; // doesn't work without --experimental-specifier-resolution=node
import sleep from "../sleep.js";

class Queue {
  constructor(client) {
    this._client = client;
    this._queue = [];
    this.existingThreadsList = [];

    this._processor = setIntervalAsync(async () => {
      await this._workProcess();
    }, 500);
  }

  addProcess(processFn, asyncBool) {
    this._queue.push({
      fn: processFn,
      async: asyncBool,
    });
  }

  async _workProcess() {
    const processObj = this._queue.shift();

    if (processObj) {
      if (processObj.async) {
        await processObj.fn(this._client);
      } else {
        processObj.fn(this._client);
      }
    } else {
      await sleep(5000);
    }
  }

  stop() {
    if (this._processor) clearIntervalAsync(this._processor);
  }

  addExistingThread(threadName) {
    if (!this.existingThreadsList.includes(threadName)) {
      this.existingThreadsList.push(threadName);
    }
  }

  removeExistingThread(threadName) {
    if (this.existingThreadsList.includes(threadName)) {
      const index = this.existingThreadsList.findIndex(
        (thName) => thName === threadName
      );
      this.existingThreadsList = [
        ...this.existingThreadsList.slice(0, index),
        ...this.existingThreadsList.slice(index + 1),
      ];
    }
  }
}

let queue;

export function initThreadProcess(client) {
  queue = new Queue(client);
}

export default function addThreadProcess(processFn, asyncBool) {
  queue.addProcess(processFn, asyncBool);
}

export function addExistingThreads(...threads) {
  for (const thread of threads) {
    queue.addExistingThread(String(thread));
  }
}

export function getExistingThreads() {
  return queue.existingThreadsList;
}

export function removeExistingThread(threadName) {
  queue.removeExistingThread(String(threadName));
}
