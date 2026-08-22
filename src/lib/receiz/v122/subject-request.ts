import {
  validateReceizSubjectAccessPublicBindingV122,
  type ReceizSubjectAccessPublicBindingV122,
  type ReceizSubjectAdmissionInputV122,
  type ReceizSubjectEdgeBundleV122,
} from "@receiz/sdk";
import { admittedWriteReport, projectionReport, zeroWriteReport } from "./authority-report";

export type ReceizSubjectRouteOperation =
  | Readonly<{ action: "state"; subjectId: string }>
  | Readonly<{ action: "accessBinding"; subjectId: string }>
  | Readonly<{ action: "admit"; artifact: File; idempotencyKey: string }>
  | Readonly<{ action: "exportEdgeBundle"; subjectId: string }>
  | Readonly<{ action: "importEdgeBundle"; bundle: ReceizSubjectEdgeBundleV122 }>
  | Readonly<{ action: "publishAccessKey"; publicBinding: ReceizSubjectAccessPublicBindingV122; expectedAccessKeyHead: string | null }>;

const FORBIDDEN_AUTHORITY_FIELDS = new Set([
  "admission", "authority", "capability", "ownerProof", "receipt", "state", "verification", "verified",
]);

function requiredString(value: unknown, code: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(code);
  return value.trim();
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("receiz_subject_route_body_invalid");
  return value as Record<string, unknown>;
}

function rejectForbiddenFields(value: Record<string, unknown>): void {
  if (Object.keys(value).some((key) => FORBIDDEN_AUTHORITY_FIELDS.has(key))) {
    throw new Error("receiz_subject_route_forbidden_authority_field");
  }
}

function requireExactKeys(value: Record<string, unknown>, keys: readonly string[]): void {
  const allowed = new Set(keys);
  if (Object.keys(value).some((key) => !allowed.has(key))) throw new Error("receiz_subject_route_unknown_field");
}

export function parseReceizSubjectGet(url: string): Extract<ReceizSubjectRouteOperation, { action: "state" | "accessBinding" | "exportEdgeBundle" }> {
  const query = new URL(url).searchParams;
  const action = query.get("action");
  const subjectId = requiredString(query.get("subjectId"), "receiz_subject_id_required");
  if (action === "state" || action === "accessBinding" || action === "exportEdgeBundle") return { action, subjectId };
  throw new Error("receiz_subject_route_action_invalid");
}

export async function parseReceizSubjectPost(request: Request): Promise<Extract<ReceizSubjectRouteOperation, { action: "admit" | "importEdgeBundle" | "publishAccessKey" }>> {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    if (form.get("action") !== "admit") throw new Error("receiz_subject_route_action_invalid");
    for (const key of form.keys()) {
      if (!["action", "artifact", "idempotencyKey"].includes(key)) throw new Error("receiz_subject_route_unknown_field");
    }
    const artifact = form.get("artifact");
    if (!(artifact instanceof File) || artifact.size === 0) throw new Error("receiz_subject_artifact_required");
    return {
      action: "admit",
      artifact,
      idempotencyKey: requiredString(form.get("idempotencyKey"), "receiz_subject_idempotency_key_required"),
    };
  }

  const body = record(await request.json());
  rejectForbiddenFields(body);
  const action = body.action;
  if (action === "importEdgeBundle") {
    requireExactKeys(body, ["action", "bundle"]);
    const bundle = record(body.bundle);
    if (bundle.schema !== "receiz.subject.edge_bundle.v122") throw new Error("receiz_subject_edge_bundle_invalid");
    return { action, bundle: body.bundle as ReceizSubjectEdgeBundleV122 };
  }
  if (action === "publishAccessKey") {
    requireExactKeys(body, ["action", "publicBinding", "expectedAccessKeyHead"]);
    const publicBinding = body.publicBinding as ReceizSubjectAccessPublicBindingV122;
    if (!(await validateReceizSubjectAccessPublicBindingV122(publicBinding))) throw new Error("receiz_subject_access_binding_invalid");
    if (body.expectedAccessKeyHead !== null && typeof body.expectedAccessKeyHead !== "string") throw new Error("receiz_subject_access_head_invalid");
    return { action, publicBinding, expectedAccessKeyHead: body.expectedAccessKeyHead };
  }
  throw new Error("receiz_subject_route_action_invalid");
}

export function buildAuthenticatedAdmission(
  operation: Extract<ReceizSubjectRouteOperation, { action: "admit" }>,
  authenticatedOwnerReceizId: string,
): ReceizSubjectAdmissionInputV122 {
  return Object.freeze({
    proofObject: operation.artifact,
    ownerReceizId: requiredString(authenticatedOwnerReceizId, "receiz_subject_owner_required"),
    idempotencyKey: operation.idempotencyKey,
    expectedAbsent: true,
  });
}

export function subjectRouteResult(primitive: string, data: unknown) {
  const failure = data && typeof data === "object" && !Array.isArray(data)
    ? data as Record<string, unknown>
    : null;
  const authority = failure?.ok === false && typeof failure.code === "string" && failure.writes === 0
    ? zeroWriteReport(primitive, failure.code)
    : primitive.includes("state") || primitive.includes("binding")
      ? projectionReport(primitive, "receiz-server-projection")
      : admittedWriteReport(primitive);
  return Object.freeze({ data, authority });
}
