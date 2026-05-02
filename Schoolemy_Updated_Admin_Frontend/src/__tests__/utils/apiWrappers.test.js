jest.mock("../../Utils/api", () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.resolve({ data: {} })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    put: jest.fn(() => Promise.resolve({ data: {} })),
    delete: jest.fn(() => Promise.resolve({ data: {} })),
    patch: jest.fn(() => Promise.resolve({ data: {} })),
  },
}));

import api from "../../Utils/api";
import * as expense from "../../Utils/expenseApi";
import * as donation from "../../Utils/donationApi";
import { legacyDirectMeetApi } from "../../Utils/directMeetLegacyApi";
import * as invoice from "../../Utils/invoiceApi";
import * as tutorCourse from "../../Utils/tutorCourseApi";
import { examAnswerApi } from "../../Utils/examAnswerApi";
import { getEventCoverImageSrc, listEvents, getEvent } from "../../Utils/eventApi";

describe("thin API wrapper modules", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("expenseApi calls expected paths", async () => {
    await expense.listExpenses({ page: 1 });
    expect(api.get).toHaveBeenCalledWith("/api/expense/list", { params: { page: 1 } });
    await expense.getExpense("e1");
    expect(api.get).toHaveBeenCalledWith("/api/expense/e1");
    await expense.createExpense({ a: 1 });
    expect(api.post).toHaveBeenCalledWith("/api/expense/create", { a: 1 });
    await expense.updateExpense("e1", { a: 2 });
    expect(api.put).toHaveBeenCalledWith("/api/expense/e1", { a: 2 });
    await expense.deleteExpense("e1");
    expect(api.delete).toHaveBeenCalledWith("/api/expense/e1");
    await expense.approveExpense("e1");
    expect(api.patch).toHaveBeenCalledWith("/api/expense/e1/approve");
    await expense.markExpenseAsPaid("e1");
    expect(api.patch).toHaveBeenCalledWith("/api/expense/e1/paid");
    await expense.rejectExpense("e1", "no");
    expect(api.patch).toHaveBeenCalledWith("/api/expense/e1/reject", { reason: "no" });
    await expense.getExpenseStatistics();
    expect(api.get).toHaveBeenCalledWith("/api/expense/statistics", { params: {} });
  });

  it("donationApi", async () => {
    await donation.listDonations();
    await donation.getDonation("d1");
    await donation.createDonation({});
    await donation.updateDonation("d1", {});
    await donation.deleteDonation("d1");
    await donation.verifyDonation("d1");
    await donation.getDonationStatistics();
    expect(api.get).toHaveBeenCalled();
    expect(api.patch).toHaveBeenCalled();
  });

  it("legacyDirectMeetApi", async () => {
    await legacyDirectMeetApi.create({});
    expect(api.post).toHaveBeenCalledWith("/api/direct-meets/create-direct-meet", {});
    await legacyDirectMeetApi.getAll({ x: 1 });
    await legacyDirectMeetApi.getById("1");
    await legacyDirectMeetApi.getByMeetId("m");
    await legacyDirectMeetApi.update("1", {});
    await legacyDirectMeetApi.delete("1");
    await legacyDirectMeetApi.softDelete("1");
    await legacyDirectMeetApi.getActive();
    await legacyDirectMeetApi.getUpcoming();
    await legacyDirectMeetApi.markCompleted("1");
    await legacyDirectMeetApi.getStats();
    await legacyDirectMeetApi.sendNotification("1");
    expect(api.get).toHaveBeenCalled();
  });

  it("invoiceApi", async () => {
    await invoice.listInvoices();
    await invoice.getInvoice("i1");
    await invoice.getInvoiceByNumber("INV-1");
    await invoice.createInvoice({});
    await invoice.updateInvoice("i1", {});
    await invoice.deleteInvoice("i1");
    await invoice.updateInvoiceStatus("i1", "paid");
    await invoice.getInvoiceStatistics();
    await invoice.downloadInvoice("INV-9");
    expect(api.get).toHaveBeenCalled();
  });

  it("tutorCourseApi validation and calls", async () => {
    await tutorCourse.getPendingTutorCourses();
    await tutorCourse.approveTutorCourse("c1", "ok");
    await expect(tutorCourse.requestChanges("c1", "   ")).rejects.toThrow(/reviewComment/);
    await tutorCourse.requestChanges("c1", "please fix");
    await expect(tutorCourse.rejectTutorCourse("c1", "")).rejects.toThrow(/reviewComment/);
    await tutorCourse.rejectTutorCourse("c1", "bad");
    expect(api.put).toHaveBeenCalled();
  });

  it("examAnswerApi", async () => {
    await examAnswerApi.getUserExamAttempts("u1");
    await examAnswerApi.getUserExamStats("u1");
    await examAnswerApi.getCourseExamAttempts("c1");
    await examAnswerApi.getExamAttempts("e1");
    await examAnswerApi.getChapterExamAttempts("c1", "Ch 1");
    await examAnswerApi.getExamAttemptById("a1");
    await examAnswerApi.getAllExamAttempts(2, 5);
    await examAnswerApi.deleteExamAttempt("a1");
    expect(api.get).toHaveBeenCalled();
    expect(api.delete).toHaveBeenCalled();
  });

  it("eventApi getEventCoverImageSrc and list helpers", () => {
    expect(getEventCoverImageSrc(null)).toBeNull();
    expect(getEventCoverImageSrc("https://x/y.png")).toBe("https://x/y.png");
    const src = getEventCoverImageSrc({ contentType: "image/png", data: "AAA" });
    expect(src).toMatch(/^data:image\/png;base64,/);
  });

  it("eventApi listEvents and getEvent", async () => {
    await listEvents({ a: 1 });
    expect(api.get).toHaveBeenCalledWith("/event/list", { params: { a: 1 } });
    await getEvent("e1");
    expect(api.get).toHaveBeenCalledWith("/event/details/e1");
  });
});
