

import ExamReattemptPolicy from "../../Utils/ExamReattemptPolicy.js";

const {
  POLICY_TEMPLATES,
  getEffectivePolicy,
  getPolicyTemplates,
  checkAttemptExhaustion,
  checkCooldownPeriod,
  checkMinScoreRequirement,
  checkPassPolicyRestriction,
  checkReattemptEligibility,
} = ExamReattemptPolicy;

describe("ExamReattemptPolicy Utils", () => {
  describe("Policy Templates", () => {
    test("provides templates for regular, emi, and tutoring courses", () => {
      expect(POLICY_TEMPLATES).toHaveProperty("regular");
      expect(POLICY_TEMPLATES).toHaveProperty("emi");
      expect(POLICY_TEMPLATES).toHaveProperty("tutoring");
    });

    test("regular template has 3 max attempts", () => {
      expect(POLICY_TEMPLATES.regular.maxAttempts).toBe(3);
    });

    test("emi template is stricter than regular", () => {
      expect(POLICY_TEMPLATES.emi.cooldownPeriodHours).toBeGreaterThan(
        POLICY_TEMPLATES.regular.cooldownPeriodHours,
      );
    });

    test("tutoring template allows reattempt after pass", () => {
      expect(POLICY_TEMPLATES.tutoring.allowReattemptAfterPass).toBe(true);
    });
  });

  describe("getEffectivePolicy", () => {
    test("returns default regular policy when no course type specified", () => {
      const exam = {};
      const policy = getEffectivePolicy(exam);
      expect(policy.maxAttempts).toBe(3); // Regular course default
      expect(policy.cooldownPeriodHours).toBe(24);
    });

    test("returns emi policy for emi course type", () => {
      const exam = { courseType: "emi" };
      const policy = getEffectivePolicy(exam);
      expect(policy.maxAttempts).toBe(2);
      expect(policy.cooldownPeriodHours).toBe(48);
    });

    test("returns tutoring policy for tutoring course type", () => {
      const exam = { courseType: "tutoring" };
      const policy = getEffectivePolicy(exam);
      expect(policy.maxAttempts).toBe(5);
      expect(policy.allowReattemptAfterPass).toBe(true);
    });

    test("merges custom exam settings with template", () => {
      const exam = { courseType: "regular", maxAttempts: 10 };
      const policy = getEffectivePolicy(exam);
      expect(policy.maxAttempts).toBe(10); // Custom override
      expect(policy.cooldownPeriodHours).toBe(24); // From template
    });
  });

  describe("checkAttemptExhaustion", () => {
    test("returns object with exhausted false when attempts remain", () => {
      const exam = { maxAttempts: 3 };
      const result = checkAttemptExhaustion(exam, 1);
      expect(result.exhausted).toBe(false);
      expect(result.attemptsRemaining).toBe(2);
      expect(result.currentAttempt).toBe(1);
    });

    test("returns exhausted true when max attempts reached", () => {
      const exam = { maxAttempts: 3 };
      const result = checkAttemptExhaustion(exam, 3);
      expect(result.exhausted).toBe(true);
      expect(result.attemptsRemaining).toBe(0);
    });

    test("calculates remaining attempts correctly", () => {
      const exam = { maxAttempts: 5 };
      const result = checkAttemptExhaustion(exam, 2);
      expect(result.attemptsRemaining).toBe(3);
    });
  });

  describe("checkCooldownPeriod", () => {
    test("returns on cooldown false when no last attempt", () => {
      const exam = { cooldownPeriodHours: 24 };
      const result = checkCooldownPeriod(exam, null);
      expect(result.onCooldown).toBe(false);
      expect(result.remainingHours).toBe(0);
    });

    test("returns on cooldown false when cooldown is 0", () => {
      const exam = { courseType: "tutoring" }; // tutoring has low cooldown
      const lastAttempt = { submittedAt: new Date() };
      const result = checkCooldownPeriod(exam, lastAttempt);
      // Tutoring has 12 hour cooldown, so should be on cooldown
      expect(result).toHaveProperty("onCooldown");
    });

    test("detects when in cooldown period", () => {
      const exam = { courseType: "regular" }; // 24 hour cooldown
      const lastAttempt = {
        submittedAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
      };
      const result = checkCooldownPeriod(exam, lastAttempt);
      expect(result.onCooldown).toBe(true);
      expect(result.remainingHours).toBeGreaterThan(0);
    });

    test("detects when cooldown has expired", () => {
      const exam = { courseType: "regular" }; // 24 hour cooldown
      const lastAttempt = {
        submittedAt: new Date(Date.now() - 48 * 60 * 60 * 1000), // 48 hours ago
      };
      const result = checkCooldownPeriod(exam, lastAttempt);
      expect(result.onCooldown).toBe(false);
    });

    test("includes remaining time information", () => {
      const exam = { courseType: "regular" };
      const lastAttempt = {
        submittedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      };
      const result = checkCooldownPeriod(exam, lastAttempt);
      expect(result).toHaveProperty("remainingHours");
      expect(result).toHaveProperty("remainingMinutes");
    });
  });

  describe("checkMinScoreRequirement", () => {
    test("returns meetsCriteria true when no min score requirement", () => {
      const exam = { courseType: "regular" }; // no min score requirement
      const lastAttempt = { obtainedMarks: 10, totalMarks: 100 };
      const result = checkMinScoreRequirement(exam, lastAttempt);
      expect(result.meetsCriteria).toBe(true);
    });

    test("returns meetsCriteria true when score meets minimum", () => {
      const exam = { minScoreForReattempt: 40 };
      const lastAttempt = { obtainedMarks: 50, totalMarks: 100 }; // 50%
      const result = checkMinScoreRequirement(exam, lastAttempt);
      expect(result.meetsCriteria).toBe(true);
    });

    test("returns meetsCriteria false when score below minimum", () => {
      const exam = { minScoreForReattempt: 50 };
      const lastAttempt = { obtainedMarks: 30, totalMarks: 100 }; // 30%
      const result = checkMinScoreRequirement(exam, lastAttempt);
      expect(result.meetsCriteria).toBe(false);
    });

    test("includes score details in result", () => {
      const exam = { minScoreForReattempt: 40 };
      const lastAttempt = { obtainedMarks: 45, totalMarks: 100 };
      const result = checkMinScoreRequirement(exam, lastAttempt);
      expect(result).toHaveProperty("lastScore");
      expect(result).toHaveProperty("minScoreRequired", 40);
    });
  });

  describe("checkPassPolicyRestriction", () => {
    test("returns blocked false when no pass policy restriction", () => {
      const exam = { courseType: "tutoring", passingScore: 50 }; // allows reattempt after pass
      const lastAttempt = { obtainedMarks: 60, totalMarks: 100 }; // 60% = passed
      const result = checkPassPolicyRestriction(exam, lastAttempt);
      expect(result.blockedByPassPolicy).toBe(false);
    });

    test("returns blocked true when passed but policy forbids reattempt", () => {
      const exam = { courseType: "regular", passingScore: 50 }; // doesn't allow reattempt after pass
      const lastAttempt = { obtainedMarks: 70, totalMarks: 100 }; // 70% = passed
      const result = checkPassPolicyRestriction(exam, lastAttempt);
      expect(result.blockedByPassPolicy).toBe(true);
    });

    test("returns blocked false when failed", () => {
      const exam = { courseType: "regular", passingScore: 50 };
      const lastAttempt = { obtainedMarks: 40, totalMarks: 100 }; // 40% = failed
      const result = checkPassPolicyRestriction(exam, lastAttempt);
      expect(result.blockedByPassPolicy).toBe(false);
    });

    test("handles no last attempt", () => {
      const exam = { courseType: "regular", passingScore: 50 };
      const result = checkPassPolicyRestriction(exam, null);
      expect(result.blockedByPassPolicy).toBe(false);
    });
  });

  describe("checkReattemptEligibility", () => {
    test("allows reattempt when all checks pass", () => {
      const exam = { courseType: "regular", passingScore: 50 };
      const attemptHistory = [
        { obtainedMarks: 45, totalMarks: 100, submittedAt: new Date(Date.now() - 48 * 60 * 60 * 1000) },
      ];
      const result = checkReattemptEligibility(exam, attemptHistory);
      expect(result.canReattempt).toBe(true);
      expect(result.reason).toBe("ELIGIBLE");
    });

    test("blocks reattempt when attempts exhausted", () => {
      const exam = { courseType: "regular", passingScore: 50 }; // maxAttempts: 3
      const attemptHistory = [
        { obtainedMarks: 30, totalMarks: 100, submittedAt: new Date(Date.now() - 72 * 60 * 60 * 1000) },
        { obtainedMarks: 35, totalMarks: 100, submittedAt: new Date(Date.now() - 48 * 60 * 60 * 1000) },
        { obtainedMarks: 40, totalMarks: 100, submittedAt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      ];
      const result = checkReattemptEligibility(exam, attemptHistory);
      expect(result.canReattempt).toBe(false);
      expect(result.reason).toBe("EXAM_ATTEMPTS_EXHAUSTED");
    });

    test("blocks reattempt during cooldown period", () => {
      const exam = { courseType: "regular", passingScore: 50 }; // 24 hour cooldown
      const attemptHistory = [
        { obtainedMarks: 45, totalMarks: 100, submittedAt: new Date(Date.now() - 12 * 60 * 60 * 1000) }, // 12 hours ago
      ];
      const result = checkReattemptEligibility(exam, attemptHistory);
      expect(result.canReattempt).toBe(false);
      expect(result.reason).toBe("EXAM_ON_COOLDOWN");
    });

    test("blocks reattempt if already passed", () => {
      const exam = { courseType: "regular", passingScore: 50 }; // doesn't allow reattempt after pass
      const attemptHistory = [
        { obtainedMarks: 70, totalMarks: 100, submittedAt: new Date(Date.now() - 48 * 60 * 60 * 1000) }, // 70% = passed
      ];
      const result = checkReattemptEligibility(exam, attemptHistory);
      expect(result.canReattempt).toBe(false);
      expect(result.reason).toBe("EXAM_ALREADY_PASSED");
    });

    test("includes detailed information in result", () => {
      const exam = { courseType: "regular", passingScore: 50 };
      const attemptHistory = [
        { obtainedMarks: 45, totalMarks: 100, submittedAt: new Date(Date.now() - 48 * 60 * 60 * 1000) },
      ];
      const result = checkReattemptEligibility(exam, attemptHistory);
      expect(result).toHaveProperty("details");
      expect(result.details).toHaveProperty("currentAttempt", 1);
      expect(result.details).toHaveProperty("maxAttempts", 3);
    });

    test("handles empty attempt history (first attempt)", () => {
      const exam = { courseType: "regular", passingScore: 50 };
      const result = checkReattemptEligibility(exam, []);
      expect(result.canReattempt).toBe(true);
      expect(result.reason).toBe("ELIGIBLE");
    });
  });

  describe("Integration scenarios", () => {
    test("regular course flow: fail, wait, reattempt, pass", () => {
      const exam = { courseType: "regular", passingScore: 50 };

      // First attempt - failed
      let result = checkReattemptEligibility(exam, [
        { obtainedMarks: 40, totalMarks: 100, submittedAt: new Date(Date.now() - 48 * 60 * 60 * 1000) },
      ]);
      expect(result.canReattempt).toBe(true); // Can reattempt after failure

      // After passing
      result = checkReattemptEligibility(exam, [
        { obtainedMarks: 40, totalMarks: 100, submittedAt: new Date(Date.now() - 96 * 60 * 60 * 1000) },
        { obtainedMarks: 65, totalMarks: 100, submittedAt: new Date(Date.now() - 48 * 60 * 60 * 1000) },
      ]);
      expect(result.canReattempt).toBe(false); // Cannot reattempt after passing
      expect(result.reason).toBe("EXAM_ALREADY_PASSED");
    });

    test("tutoring course: allows reattempt even after passing", () => {
      const exam = { courseType: "tutoring", passingScore: 50 };
      const result = checkReattemptEligibility(exam, [
        { obtainedMarks: 70, totalMarks: 100, submittedAt: new Date(Date.now() - 48 * 60 * 60 * 1000) }, // passed
      ]);
      expect(result.canReattempt).toBe(true); // Tutoring allows reattempt after pass
    });
  });
});
