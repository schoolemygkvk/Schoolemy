import VotingPoll from "../Models/BOS/bos-Voting.js";
import CONFIG from "../config/constants.js";

export const updatePollStatuses = async () => {
  try {
    const now = new Date();

    await VotingPoll.updateMany(
      {
        status: "draft",
        start_date: { $lte: now }
      },
      {
        $set: { status: "active" }
      }
    );

    await VotingPoll.updateMany(
      {
        status: "active",
        end_date: { $lte: now },
        "settings.auto_close_on_end_date": true
      },
      {
        $set: { status: "completed" }
      }
    );

  } catch (error) {
    console.error("Error updating poll statuses:", error);
  }
};

export const startPollStatusScheduler = () => {
  setInterval(updatePollStatuses, CONFIG.POLL_CHECK_INTERVAL);
  updatePollStatuses();
};

export const checkPollDeadlines = async () => {
  try {
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const pollsEndingInOneHour = await VotingPoll.find({
      status: "active",
      end_date: {
        $gte: now,
        $lte: oneHourFromNow
      }
    });

    const pollsEndingInOneDay = await VotingPoll.find({
      status: "active",
      end_date: {
        $gte: oneHourFromNow,
        $lte: oneDayFromNow
      }
    });

    if (pollsEndingInOneHour.length > 0) {
      console.log(`${pollsEndingInOneHour.length} polls ending in 1 hour`);
    }

    if (pollsEndingInOneDay.length > 0) {
      console.log(`${pollsEndingInOneDay.length} polls ending in 1 day`);
    }

  } catch (error) {
    console.error("Error checking poll deadlines:", error);
  }
};

export const startDeadlineChecker = () => {
  setInterval(checkPollDeadlines, CONFIG.POLL_DEADLINE_CHECK_INTERVAL);
};
