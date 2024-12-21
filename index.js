const fetch = require("node-fetch");
const { DateTime } = require("luxon");

const boogsDisciplesWebHook = process.env.boogs_disciples_webhook;
const theCommunityWebHook = process.env.the_community_webhook;

const main = async () => {
  try {
    console.log(`${boogsDisciplesWebHook} and ${theCommunityWebHook}`);
    const profileData = await getProfileData();
    await processProfileData(profileData);
  } catch (error) {
    console.error("Error in handler:", error);
  }
};

async function processProfileData(profileData) {
  const targetedLanguages = profileData.filter(({ title }) =>
    ["Croatian", "Portuguese"].includes(title)
  );

  for (const language of targetedLanguages) {
    const { title, lastUsed, knownWords } = language;
    const onTrack = checkIfPracticedToday(lastUsed);
    const timestamp = DateTime.now()
      .setZone("America/Los_Angeles")
      .startOf("second")
      .toFormat("yyyy-MM-dd HH:mm:ss");

    let message;

    if (onTrack) {
      message = `${
        title === "Croatian" ? "Adam" : "Thomas"
      } studied ${title} today! His known words count is ${knownWords} as of ${timestamp}`;
    } else {
      const mention =
        title === "Croatian"
          ? "<@325116664376983553>"
          : "<@526628016386867202>";
      message = `${mention} Go study ${title}. You last studied on ${lastUsed}. Your known words count is ${knownWords} as of ${timestamp}`;
    }

    const webhooks =
      title === "Croatian"
        ? [boogsDisciplesWebHook, theCommunityWebHook]
        : [theCommunityWebHook];
    await sendMessagesToWebhooks(message, webhooks);
  }
}

const sendMessagesToWebhooks = async (message, webhooks) => {
  const payload = { content: message };

  await Promise.all(
    webhooks.map((url) =>
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
    )
  );
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

const getProfileData = async () => {
  try {
    const response = await fetch(
      "https://www.lingq.com/api/v2/languages/?username=Quafle"
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error("Error in getProfileData:", error);
    throw error;
  }
};

main();
