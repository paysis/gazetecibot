import { MessageEmbed } from "discord.js";
import htmlparser from "htmlparser2";
import { hyperlink } from "@discordjs/builders";

const baseurl = "https://eksisozluk.com";

export default function constructFirstEntryMessage(
  title,
  bodyObj,
  eksiLink,
  eksiAuthor,
  eksiDate
) {
  let newBody = structEntry(bodyObj);
  newBody = parseStruct(newBody);

  const newEmbed = new MessageEmbed() //add setThumbnail
    .setColor("#0099ff")
    .setTitle(title)
    .setURL(eksiLink)
    .setAuthor(eksiAuthor)
    .setDescription(
      newBody.length >= 4093 ? `${newBody.substring(0, 4093)}...` : newBody
    )
    .addField("Şu zamanda oluşturuldu", eksiDate.created_at, true)
    .setTimestamp(new Date()); // eksiDate: { created_at, updated_at }

  if (eksiDate.updated_at) {
    newEmbed.addField("Şu zamanda düzenlendi", eksiDate.updated_at, true);
  }

  return newEmbed;
}

function parseStruct(objArray) {
  function parseDiscord(obj) {
    const recursive = () =>
      obj.nestedStructor
        ? obj.text + parseDiscord(obj.nestedStructor)
        : obj.text;

    if (
      obj.name === "a" &&
      obj.attributes.hasOwnProperty("href") &&
      obj.attributes.href.length > 0
    ) {
      return hyperlink(recursive(), obj.attributes.href, recursive());
    } else if (obj.name === "a") {
      return hyperlink(recursive(), "", "Herhangi bir link belirtilmemiş.");
    } else if (obj.name === "br") {
      return "\n";
    }

    return recursive();
  }

  let res = "";

  objArray.forEach((struct) => {
    res += parseDiscord(struct);
    /*let nested = struct;
    while (nested !== null) {
      res += parseDiscord(nested);
      nested = nested.nestedStructor;
    }*/
  });

  return res;
}

class Structor {
  name;
  text;
  attributes;
  nestedStructor;
  _encountered;
  _deleted;

  constructor() {
    this.name = null;
    this.text = "";
    this.attributes = null;
    this.nestedStructor = null;
    this._deleted = false;
    this._encountered = false;
  }

  get deleted() {
    return this._deleted;
  }

  get encountered() {
    return this._encountered;
  }

  set deleted(val) {
    if (val) {
      this._deleted = true;
      this.name = null;
      this.text = "";
      this.attributes = null;
      this.nestedStructor = null;
    }
  }

  set encountered(val) {
    if (val) {
      this._encountered = true;
    }
  }
}

function getInsideStruct(struct, includeEncountered = true) {
  if (!struct) {
    return undefined;
  }

  let deepest = struct;
  if (includeEncountered) {
    while (deepest.nestedStructor !== null) {
      deepest = deepest.nestedStructor;
    }
  } else {
    while (
      deepest.nestedStructor !== null &&
      !deepest.nestedStructor.encountered
    ) {
      deepest = deepest.nestedStructor;
    }
  }
  return deepest;
}

function structEntry(body) {
  let res = "";

  if (typeof body !== "string") return res;
  //console.log("structEntry body 132", body);
  const objArray = [];
  let tagOpen = false;

  let currentObj = null;

  const parser = new htmlparser.Parser({
    onopentag(name, attributes) {
      //tagOpen = true;
      if (!currentObj) {
        currentObj = new Structor();
        currentObj.name = name;
        currentObj.attributes = attributes;
        currentObj.text = "";
      } else {
        const insideObj = getInsideStruct(currentObj);
        insideObj.nestedStructor = new Structor();
        insideObj.nestedStructor.name = name;
        insideObj.nestedStructor.attributes = attributes;
        insideObj.nestedStructor.text = "";
      }
    },
    ontext(text) {
      if (currentObj) {
        getInsideStruct(currentObj).text += text;
      } else {
        const tmp = new Structor();
        tmp.text = text;
        objArray.push(tmp);
      }
    },
    onclosetag(name) {
      //tagOpen = false;

      if (currentObj) {
        const insideObj = getInsideStruct(currentObj, false);
        if (insideObj.name === name) {
          insideObj.encountered = true;
        }

        if (currentObj === insideObj && currentObj.name === name) {
          objArray.push({ ...currentObj });
          currentObj = null;
        }
      }
    },
  });

  parser.write(body);
  parser.end();

  return objArray;
}
