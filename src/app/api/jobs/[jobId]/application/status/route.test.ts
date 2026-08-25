const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  updateApplicationStatus: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: mocks.getSession } },
}));

vi.mock("@/features/applications/mutations", () => {
  class ApplicationJobUnavailableError extends Error {}
  class ApplicationUnavailableError extends Error {}
  class ApplicationStatusUnchangedError extends Error {}
  return {
    ApplicationJobUnavailableError,
    ApplicationUnavailableError,
    ApplicationStatusUnchangedError,
    updateApplicationStatus: mocks.updateApplicationStatus,
  };
});

import {
  ApplicationJobUnavailableError,
  ApplicationStatusUnchangedError,
  ApplicationUnavailableError,
} from "@/features/applications/mutations";

import { PATCH } from "./route";

const JOB_ID = "123e4567-e89b-42d3-a456-426614174000";
const USER_ID = "123e4567-e89b-42d3-a456-426614174001";

function request(
  jobId: string,
  body: unknown,
  origin = "http://localhost:3000",
) {
  return PATCH(
    new Request(`http://localhost:3000/api/jobs/${jobId}/application/status`, {
      method: "PATCH",
      headers: { "content-type": "application/json", origin },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ jobId }) },
  );
}

describe("PATCH /api/jobs/{jobId}/application/status", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv("BETTER_AUTH_URL", "http://localhost:3000");
  });

  afterEach(() => vi.unstubAllEnvs());

  it("requires authentication and does not accept a client actor id", async () => {
    mocks.getSession.mockResolvedValue(null);
    expect((await request(JOB_ID, { status: "APPLIED" })).status).toBe(401);

    mocks.getSession.mockResolvedValue({ user: { id: USER_ID } });
    const injectedActor = await request(JOB_ID, {
      status: "APPLIED",
      changedByUserId: "attacker-id",
    });
    expect(injectedActor.status).toBe(422);
    expect(mocks.updateApplicationStatus).not.toHaveBeenCalled();
  });

  it("validates origin, path, and status", async () => {
    mocks.getSession.mockResolvedValue({ user: { id: USER_ID } });
    expect(
      (await request(JOB_ID, { status: "APPLIED" }, "https://example.test"))
        .status,
    ).toBe(403);
    expect((await request("invalid", { status: "APPLIED" })).status).toBe(400);
    expect((await request(JOB_ID, { status: "UNKNOWN" })).status).toBe(422);
    expect(mocks.updateApplicationStatus).not.toHaveBeenCalled();
  });

  it("uses the authenticated user and returns the updated status", async () => {
    mocks.getSession.mockResolvedValue({ user: { id: USER_ID } });
    const updated = {
      id: "application-id",
      jobId: JOB_ID,
      status: "APPLIED",
      statusUpdatedAt: "2026-08-25T07:00:00.000Z",
    };
    mocks.updateApplicationStatus.mockResolvedValue(updated);

    const response = await request(JOB_ID, { status: "APPLIED" });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(updated);
    expect(mocks.updateApplicationStatus).toHaveBeenCalledWith(
      JOB_ID,
      { status: "APPLIED" },
      USER_ID,
    );
  });

  it.each([
    [new ApplicationJobUnavailableError(), "JOB_NOT_FOUND"],
    [new ApplicationUnavailableError(), "APPLICATION_NOT_FOUND"],
    [new ApplicationStatusUnchangedError(), "APPLICATION_STATUS_UNCHANGED"],
  ])("maps domain errors", async (error, code) => {
    mocks.getSession.mockResolvedValue({ user: { id: USER_ID } });
    mocks.updateApplicationStatus.mockRejectedValue(error);

    const response = await request(JOB_ID, { status: "APPLIED" });

    expect([404, 409]).toContain(response.status);
    expect(await response.json()).toMatchObject({ code });
  });
});
