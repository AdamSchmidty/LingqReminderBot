const fetch = require("node-fetch");
const { DateTime } = require("luxon");

const boogsDisciplesWebHook = process.env.boogs_disciples_webhook;
const theCommunityWebHook = process.env.the_community_webhook;

const main = async (event) => {
  try {
    console.log(`${boogsDisciplesWebHook} and ${theCommunityWebHook}`);
    const res = await getProfileData();
    handleProfileData(res);
  } catch (error) {
    console.error("Error in handler:", error);
  }
};

async function handleProfileData(profileData) {
  const res = await getProfileData();
  const targetedLanguages = res.filter(
    (langEntry) =>
      langEntry["title"] === "Croatian" || langEntry["title"] === "Portuguese"
  );

  targetedLanguages.forEach((language) => {
    const lastPracticed = language["lastUsed"];
    const onTrack = checkIfPracticedToday(lastPracticed);

    if (language["title"] === "Croatian") {
      if (onTrack) {
        const message = `Adam studied Croatian today! His known words count is ${
          language["knownWords"]
        } as of ${DateTime.now()
          .setZone("America/Los_Angeles")
          .startOf("second")
          .toFormat("yyyy-MM-dd HH:mm:ss")}`;
        sendDiscordMessage(message, boogsDisciplesWebHook);
        sendDiscordMessage(message, theCommunityWebHook);
      } else {
        const message = `<@325116664376983553> Go study Croatian. You last studied on ${
          language["lastUsed"]
        }. Your known words count is ${
          language["knownWords"]
        } as of ${DateTime.now()
          .setZone("America/Los_Angeles")
          .startOf("second")
          .toFormat("yyyy-MM-dd HH:mm:ss")}`;
        sendDiscordMessage(message, boogsDisciplesWebHook);
        sendDiscordMessage(message, theCommunityWebHook);
      }
    } else if (language["title"] === "Portuguese") {
      if (onTrack) {
        const message = `Thomas studied Portuguese today! His known words count is ${
          language["knownWords"]
        } as of ${DateTime.now()
          .setZone("America/Los_Angeles")
          .startOf("second")
          .toFormat("yyyy-MM-dd HH:mm:ss")}`;
        sendDiscordMessage(message, theCommunityWebHook);
      } else {
        const message = `<@526628016386867202> Go study Portuguese. You last studied on ${
          language["lastUsed"]
        }. Your known words count is ${
          language["knownWords"]
        } as of ${DateTime.now()
          .setZone("America/Los_Angeles")
          .startOf("second")
          .toFormat("yyyy-MM-dd HH:mm:ss")}`;
        sendDiscordMessage(message, theCommunityWebHook);
      }
    }

    console.log(targetedLanguages);
  });
}

const sendDiscordMessage = async (message, url) => {
  const payload = {
    content: message,
  };

  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
};

const checkIfPracticedToday = (targetDateString) => {
  const currentDate = DateTime.now()
    .setZone("America/Los_Angeles")
    .startOf("day");
  const targetDate = DateTime.fromISO(targetDateString, {
    zone: "America/Los_Angeles",
  });
  return currentDate.equals(targetDate);
};

async function getProfileData() {
  try {
    const response = await fetch(
      "https://www.lingq.com/api/v2/languages/?username=Quafle"
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error in getProfileData:", error);
    throw error;
  }
}

main();
