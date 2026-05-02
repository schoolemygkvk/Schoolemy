

const POLICY_TEMPLATES = {
  regular: {
    maxAttempts: 3,
    cooldownPeriodHours: 24,
    minScoreForReattempt: null, // No minimum score requirement
    allowReattemptAfterPass: false, // No reattempt after passing by default
  },
  emi: {
    maxAttempts: 2,
    cooldownPeriodHours: 48, // 48 hours for EMI courses (stricter)
    minScoreForReattempt: null,
    allowReattemptAfterPass: false,
  },
  tutoring: {
    maxAttempts: 5, // More attempts for tutoring courses
    cooldownPeriodHours: 12, // 12 hours between attempts (more flexible)
    minScoreForReattempt: null,
    allowReattemptAfterPass: true, // Allow improving score even after passing
  },
};


export const getEffectivePolicy = (exam) => {
  const courseType = exam.courseType || "regular";
  const template = POLICY_TEMPLATES[courseType] || POLICY_TEMPLATES.regular;

  return {
    maxAttempts: exam.maxAttempts !== undefined ? exam.maxAttempts : template.maxAttempts,
    cooldownPeriodHours: exam.cooldownPeriodHours !== undefined ? exam.cooldownPeriodHours : template.cooldownPeriodHours,
    minScoreForReattempt: exam.minScoreForReattempt !== undefined ? exam.minScoreForReattempt : template.minScoreForReattempt,
    allowReattemptAfterPass: exam.allowReattemptAfterPass !== undefined ? exam.allowReattemptAfterPass : template.allowReattemptAfterPass,
  };
};


export const getPolicyTemplates = () => POLICY_TEMPLATES;


export const checkAttemptExhaustion = (exam, currentAttemptCount) => {
  const policy = getEffectivePolicy(exam);
  const exhausted = currentAttemptCount >= policy.maxAttempts;

  return {
    exhausted,
    currentAttempt: currentAttemptCount,
    maxAttempts: policy.maxAttempts,
    attemptsRemaining: Math.max(0, policy.maxAttempts - currentAttemptCount),
  };
};


export const checkCooldownPeriod = (exam, lastAttempt) => {
  const policy = getEffectivePolicy(exam);

  if (!lastAttempt || policy.cooldownPeriodHours === 0) {
    return {
      onCooldown: false,
      availableAt: null,
      remainingHours: 0,
      remainingMinutes: 0,
    };
  }

  const cooldownMs = policy.cooldownPeriodHours * 60 * 60 * 1000;
  const availableAt = new Date(lastAttempt.submittedAt.getTime() + cooldownMs);
  const now = new Date();
  const onCooldown = now < availableAt;

  if (!onCooldown) {
    return {
      onCooldown: false,
      availableAt: null,
      remainingHours: 0,
      remainingMinutes: 0,
    };
  }

  const remainingMs = availableAt.getTime() - now.getTime();
  const remainingHours = Math.ceil(remainingMs / (60 * 60 * 1000));
  const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));

  return {
    onCooldown: true,
    availableAt,
    remainingHours,
    remainingMinutes,
    cooldownPeriodHours: policy.cooldownPeriodHours,
  };
};


export const checkMinScoreRequirement = (exam, lastAttempt) => {
  const policy = getEffectivePolicy(exam);

  // No minimum score requirement configured
  if (policy.minScoreForReattempt === null || policy.minScoreForReattempt === undefined) {
    return {
      meetsCriteria: true,
      lastScore: lastAttempt ? lastAttempt.obtainedMarks : 0,
      minScoreRequired: null,
    };
  }

  if (!lastAttempt) {
    return {
      meetsCriteria: true,
      lastScore: 0,
      minScoreRequired: policy.minScoreForReattempt,
    };
  }

  // Calculate percentage score
  const scorePercentage = (lastAttempt.obtainedMarks / lastAttempt.totalMarks) * 100;
  const meetsCriteria = scorePercentage >= policy.minScoreForReattempt;

  return {
    meetsCriteria,
    lastScore: scorePercentage,
    minScoreRequired: policy.minScoreForReattempt,
    lastScoreMarks: lastAttempt.obtainedMarks,
    totalMarks: lastAttempt.totalMarks,
  };
};


export const checkPassPolicyRestriction = (exam, lastAttempt) => {
  const policy = getEffectivePolicy(exam);

  if (!lastAttempt || policy.allowReattemptAfterPass === true || !exam.passingScore) {
    return {
      blockedByPassPolicy: false,
      lastScore: lastAttempt ? lastAttempt.obtainedMarks : 0,
      passingScore: exam.passingScore,
    };
  }

  // Check if student passed
  const scorePercentage = (lastAttempt.obtainedMarks / lastAttempt.totalMarks) * 100;
  const passed = scorePercentage >= exam.passingScore;

  return {
    blockedByPassPolicy: passed && !policy.allowReattemptAfterPass,
    lastScore: scorePercentage,
    passingScore: exam.passingScore,
  };
};


export const checkReattemptEligibility = (exam, attemptHistory) => {
  const policy = getEffectivePolicy(exam);
  const lastAttempt = attemptHistory && attemptHistory.length > 0
    ? attemptHistory[attemptHistory.length - 1]
    : null;

  const attemptCount = attemptHistory ? attemptHistory.length : 0;

  // Check 1: Attempt exhaustion
  const attemptCheck = checkAttemptExhaustion(exam, attemptCount);
  if (attemptCheck.exhausted) {
    return {
      canReattempt: false,
      reason: "EXAM_ATTEMPTS_EXHAUSTED",
      message: `You have reached the maximum number of attempts (${policy.maxAttempts}). No more attempts allowed.`,
      details: {
        currentAttempt: attemptCheck.currentAttempt,
        maxAttempts: attemptCheck.maxAttempts,
        attemptsRemaining: attemptCheck.attemptsRemaining,
      },
    };
  }

  // Check 2: Cooldown period
  if (lastAttempt) {
    const cooldownCheck = checkCooldownPeriod(exam, lastAttempt);
    if (cooldownCheck.onCooldown) {
      return {
        canReattempt: false,
        reason: "EXAM_ON_COOLDOWN",
        message: `You must wait before retaking this exam. Available in ${cooldownCheck.remainingHours} hour(s).`,
        details: {
          currentAttempt: attemptCount,
          maxAttempts: policy.maxAttempts,
          cooldownPeriodHours: policy.cooldownPeriodHours,
          availableAt: cooldownCheck.availableAt,
          remainingHours: cooldownCheck.remainingHours,
          remainingMinutes: cooldownCheck.remainingMinutes,
        },
      };
    }
  }

  // Check 3: Minimum score requirement
  if (lastAttempt) {
    const scoreCheck = checkMinScoreRequirement(exam, lastAttempt);
    if (!scoreCheck.meetsCriteria) {
      return {
        canReattempt: false,
        reason: "EXAM_SCORE_TOO_LOW",
        message: `Your score (${scoreCheck.lastScore.toFixed(1)}%) does not meet the minimum required (${scoreCheck.minScoreRequired}%) to reattempt.`,
        details: {
          currentAttempt: attemptCount,
          maxAttempts: policy.maxAttempts,
          lastScore: scoreCheck.lastScoreMarks,
          totalMarks: scoreCheck.totalMarks,
          minScoreRequired: policy.minScoreForReattempt,
          lastScorePercentage: scoreCheck.lastScore,
        },
      };
    }
  }

  // Check 4: Pass policy restriction
  if (lastAttempt) {
    const passCheck = checkPassPolicyRestriction(exam, lastAttempt);
    if (passCheck.blockedByPassPolicy) {
      return {
        canReattempt: false,
        reason: "EXAM_ALREADY_PASSED",
        message: "You have already passed this exam. Reattemption is not allowed.",
        details: {
          currentAttempt: attemptCount,
          maxAttempts: policy.maxAttempts,
          lastScore: passCheck.lastScore,
          passingScore: passCheck.passingScore,
        },
      };
    }
  }

  // All checks passed - student is eligible
  const nextReattemptAvailableAt = lastAttempt
    ? new Date(lastAttempt.submittedAt.getTime() + (policy.cooldownPeriodHours * 60 * 60 * 1000))
    : null;

  return {
    canReattempt: true,
    reason: "ELIGIBLE",
    message: "You are eligible to reattempt this exam.",
    details: {
      currentAttempt: attemptCount,
      maxAttempts: policy.maxAttempts,
      attemptsRemaining: attemptCheck.attemptsRemaining,
      nextReattemptAvailableAt,
      cooldownPeriodHours: policy.cooldownPeriodHours,
    },
  };
};

export default {
  POLICY_TEMPLATES,
  getEffectivePolicy,
  getPolicyTemplates,
  checkAttemptExhaustion,
  checkCooldownPeriod,
  checkMinScoreRequirement,
  checkPassPolicyRestriction,
  checkReattemptEligibility,
};
