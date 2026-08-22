import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildAuthenticatedAdmission,
  parseReceizSubjectGet,
  parseReceizSubjectPost,
  subjectRouteResult,
} from "../src/lib/receiz/v122/subject-request";

describe("Receiz v122 subject route law", () => {
  it("uses authenticated ownership and an exact idempotency key for admission", async () => {
    const form = new FormData();
    form.set("action", "admit");
    form.set("idempotencyKey", "subject-admit-1");
    form.set("artifact", new File([new Uint8Array([1, 2, 3])], "subject.receiz", { type: "application/octet-stream" }));
    const operation = await parseReceizSubjectPost(new Request("https://app.invalid/api/receiz/v122/subjects", { method: "POST", body: form }));
    assert.equal(operation.action, "admit");
    if (operation.action !== "admit") throw new Error("expected admit");
    const admission = buildAuthenticatedAdmission(operation, "owner.receiz.id");
    assert.equal(admission.ownerReceizId, "owner.receiz.id");
    assert.equal(admission.idempotencyKey, "subject-admit-1");
    assert.equal(admission.expectedAbsent, true);
    assert.equal("ownerReceizId" in operation, false);
  });

  it("rejects authority-shaped input and labels projections and failures", async () => {
    assert.deepEqual(parseReceizSubjectGet("https://app.invalid/api/receiz/v122/subjects?action=state&subjectId=subject-1"), { action: "state", subjectId: "subject-1" });
    await assert.rejects(
      parseReceizSubjectPost(new Request("https://app.invalid/api/receiz/v122/subjects", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "publishAccessKey", publicBinding: {}, expectedAccessKeyHead: null, receipt: {} }),
      })),
      /receiz_subject_route_forbidden_authority_field/,
    );
    assert.equal(subjectRouteResult("receiz.subject.state.v122", { schema: "receiz.subject.state.v122" }).authority.proven, false);
    const denied = subjectRouteResult("receiz.subject.admit.v122", { ok: false, code: "SUBJECT_OWNER_CONFLICT", writes: 0 });
    assert.equal(denied.authority.writes, 0);
    assert.equal(denied.authority.denialCode, "SUBJECT_OWNER_CONFLICT");
  });
});
