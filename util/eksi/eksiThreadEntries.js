import axios from "axios";
import cheerio from "cheerio";
import url from "url";

const type = "gundem";
const baseurl = "https://eksisozluk.com";

export async function getEntry(slug) {
  const linkToPage = `${baseurl}${slug.startsWith("/") ? slug : `/${slug}`}`;
  let response;
  try {
    response = await axios.get(linkToPage);
  } catch (err) {
    return { error: err.message };
  }

  let $ = cheerio.load(response.data, { decodeEntities: false });

  const firstEntry = $("#entry-item-list").find("li").first();

  const entry_body = $(firstEntry).find(".content").html().trim();
  const entry_author = $(firstEntry).find(".entry-author").text();
  const entry_date = $(firstEntry).find(".entry-date").text();
  const [entry_created_at, entry_updated_at] = parseDate(entry_date);

  return {
    author: entry_author,
    body: entry_body,
    date: {
      created_at: entry_created_at,
      updated_at: entry_updated_at,
    },
    linkToPage,
  };
}

export default async function getThreadList() {
  let response;
  try {
    response = await axios.get(`${baseurl}/${type}`, {
      headers: {
        "X-Requested-With": "XMLHttpRequest",
      },
    });
  } catch (err) {
    return { error: err.message };
  }

  let $ = cheerio.load(response.data, {
    decodeEntities: false,
  });

  let title, slug, entry_count, id, disambiguations;
  let threads = [];
  let thread = {};

  $(".topic-list")
    .find("li > a")
    .each((index, element) => {
      title = $(element)
        .contents()
        .filter(function () {
          return this.nodeType === 3;
        })
        .text()
        .trim();

      slug = $(element).attr("href");
      entry_count = $(element).find("small").text() || 1;
      id = idFromSlug(slug);
      thread = {
        id: parseInt(id),
        title: String(title),
        slug,
        entry_count: parseEntryCount(entry_count),
      };
      threads.push(thread);
    });

  threads = threads.sort((a, b) => b.entry_count - a.entry_count); //.slice(0, 25);

  return threads;
}

function idFromSlug(slug) {
  let pathname = url.parse(slug).pathname;
  let splar = pathname.split("--");

  return splar[splar.length - 1];
}

function parseEntryUrl(url) {
  return url.split("/baslik/")[1];
}

function parseEntryCount(entry_count) {
  let res;

  let entry = entry_count.toString();
  if (entry.includes("b")) {
    entry = entry.replace(",", "");
    entry = entry.replace("b", "");
    res = `${entry}00`;
  } else res = entry;

  return parseInt(res);
}

function parseDate(date) {
  let created_at = date;
  let updated_at = created_at.includes("~")
    ? created_at.split("~")[1].trim()
    : null;

  if (updated_at) {
    created_at = created_at.slice(0, -1 * (updated_at.length + 2)).trim();
    if (created_at.length > updated_at.length) {
      updated_at = created_at.slice(0, -1 * updated_at.length) + updated_at;
    }
  }

  return [created_at, updated_at];
}
