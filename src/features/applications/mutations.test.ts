const mocks = vi.hoisted(() => ({
  queryRaw: vi.fn(),
  update: vi.fn(),
  createHistory: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: { $transaction: mocks.transaction },
}));

import {
  ApplicationJobUnavailableError,
  ApplicationStatusUnchangedError,
  ApplicationUnavailableError,
  updateApplicationStatus,
} from "./mutations";

describe("updateApplicationStatus", () => {
  const jobId = "123e4567-e89b-42d3-a456-426614174000";
  const applicationId = "123e4567-e89b-42d3-a456-426614174001";
  const userId = "123e4567-e89b-42d3-a456-426614174002";
  const changedAt = new Date("2026-08-25T07:00:00.000Z");

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(changedAt);
    vi.resetAllMocks();
    mocks.transaction.mockImplementation(
      (operation: (transaction: unknown) => unknown) =>
        operation({
          $queryRaw: mocks.queryRaw,
          application: { update: mocks.update },
          applicationStatusHistory: { create: mocks.createHistory },
        }),
    );
  });

  afterEach(() => vi.useRealTimers());

  it("updates the Application and appends history with one timestamp", async () => {
    mocks.queryRaw
      .mockResolvedValueOnce([{ id: jobId, deleted_at: null }])
      .mockResolvedValueOnce([
        { id: applicationId, current_status: "NOT_APPLIED" },
      ]);
    mocks.update.mockResolvedValue({
      id: applicationId,
      jobId,
      currentStatus: "APPLIED",
    });
    mocks.createHistory.mockResolvedValue({ id: "history-id" });

    await expect(
      updateApplicationStatus(jobId, { status: "APPLIED" }, userId),
    ).resolves.toEqual({
      id: applicationId,
      jobId,
      status: "APPLIED",
      statusUpdatedAt: changedAt.toISOString(),
    });
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          currentStatus: "APPLIED",
          statusUpdatedAt: changedAt,
          updatedAt: changedAt,
        }),
      }),
    );
    expect(mocks.createHistory).toHaveBeenCalledWith({
      data: {
        applicationId,
        previousStatus: "NOT_APPLIED",
        newStatus: "APPLIED",
        changedAt,
        changedByUserId: userId,
      },
    });
  });

  it("rejects the same status without writing", async () => {
    mocks.queryRaw
      .mockResolvedValueOnce([{ id: jobId, deleted_at: null }])
      .mockResolvedValueOnce([
        { id: applicationId, current_status: "APPLIED" },
      ]);

    await expect(
      updateApplicationStatus(jobId, { status: "APPLIED" }, userId),
    ).rejects.toBeInstanceOf(ApplicationStatusUnchangedError);
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.createHistory).not.toHaveBeenCalled();
  });

  it("distinguishes an unavailable Job from a missing Application", async () => {
    mocks.queryRaw.mockResolvedValueOnce([]);
    await expect(
      updateApplicationStatus(jobId, { status: "APPLIED" }, userId),
    ).rejects.toBeInstanceOf(ApplicationJobUnavailableError);

    mocks.queryRaw
      .mockResolvedValueOnce([{ id: jobId, deleted_at: null }])
      .mockResolvedValueOnce([]);
    await expect(
      updateApplicationStatus(jobId, { status: "APPLIED" }, userId),
    ).rejects.toBeInstanceOf(ApplicationUnavailableError);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("propagates a history failure so the transaction can roll back", async () => {
    mocks.queryRaw
      .mockResolvedValueOnce([{ id: jobId, deleted_at: null }])
      .mockResolvedValueOnce([
        { id: applicationId, current_status: "NOT_APPLIED" },
      ]);
    mocks.update.mockResolvedValue({
      id: applicationId,
      jobId,
      currentStatus: "APPLIED",
    });
    mocks.createHistory.mockRejectedValue(new Error("history failed"));

    await expect(
      updateApplicationStatus(jobId, { status: "APPLIED" }, userId),
    ).rejects.toThrow("history failed");
  });
});
