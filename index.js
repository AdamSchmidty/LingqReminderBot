const fetch = require("node-fetch");
const { DateTime } = require("luxon");

const boogsDisciplesWebHook = process.env.boogs_disciples_webhook;
const theCommunityWebHook = process.env.the_community_webhook;
const leetCodeUsernames = JSON.parse(process.env.leetcode_usernames);
const lingqUser = process.env.lingq_user;

const main = async () => {
  try {
    processLeetCodeData(leetCodeUsernames);
    const lingqProfileData = await getLingqProfileData(lingqUser);
    await processLingqProfileData(lingqProfileData);
  } catch (error) {
    console.error("Error in handler:", error);
  }
};

async function processLeetCodeData(userNames) {
  for (user of userNames) {
    const mostRecentSubmissionData = (
      await getLeetcodeProfileData(user.leetcodeName)
    ).data.recentAcSubmissionList[0];

    const submissionDate = new Date(
      Number(mostRecentSubmissionData.timestamp) * 1000
    );
    const practicedToday = checkIfPracticedToday(submissionDate);

    const submissionDateInFreedomFormat = `${
      submissionDate.getMonth() + 1
    }/${submissionDate.getDate()}/${submissionDate.getFullYear()}`;

    const message = practicedToday
      ? `${user.actualName} practiced leetcode today! The problem they last submitted was ${mostRecentSubmissionData.title}`
      : `${user.discordHandle} please practice leetcode today! You last made a submission of ${mostRecentSubmissionData.title} on ${submissionDateInFreedomFormat}`;

    sendMessagesToWebhooks(message, [boogsDisciplesWebHook]);
  }
}

async function processLingqProfileData(profileData) {
  const targetedLanguages = profileData.filter(({ title }) =>
    ["Croatian", "Portuguese"].includes(title)
  );

  for (const language of targetedLanguages) {
    const { title, lastUsed, knownWords } = language;
    const onTrack = checkIfPracticedToday(lastUsed);
    const timestamp = DateTime.now()
      .setZone("America/Los_Angeles")
      .startOf("second")
      .toFormat("MM/dd/yyyy HH:mm:ss");

    let message;

    if (onTrack) {
      message = `${
        title === "Croatian" ? "Adam" : "Thomas"
      } studied ${title} today! His known words count is ${knownWords} as of ${timestamp}`;
    } else {
      const mention =
        title === "Croatian" ? "<@325116664376983553>" : "@526628016386867202>";
      message = `${mention} Go study ${title}. You last studied on ${lastUsed}. Your known words count is ${knownWords} as of ${timestamp} PST`;
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

const getLingqProfileData = async (lingqUser) => {
  try {
    const response = await fetch(
      `https://www.lingq.com/api/v2/languages/?username=${lingqUser}`
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

const getLeetcodeProfileData = async (userName) => {
  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  myHeaders.append(
    "Cookie",
    "csrftoken=GR3H50SaOaujIfZm3EMur8McS6ZJVkTafl9JSKpmIfLXAoXmQjhwiWZfY0vMR39R"
  );

  const raw = JSON.stringify({
    query:
      "\n    query recentAcSubmissions($username: String!, $limit: Int!) {\n  recentAcSubmissionList(username: $username, limit: $limit) {\n    id\n    title\n    titleSlug\n    timestamp\n  }\n}\n    ",
    variables: {
      username: userName,
      limit: 1,
    },
    operationName: "recentAcSubmissions",
  });

  const requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: raw,
    redirect: "follow",
  };

  const response = await fetch(
    "https://leetcode.com/graphql/\n",
    requestOptions
  );
  return response.json();
};

main();
