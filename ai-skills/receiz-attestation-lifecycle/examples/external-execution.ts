import {
  RECEIZ_NOTIFICATION_EXECUTION_PROFILE_V125,
  createReceizExternalExecutionRuntimeV125,
  planReceizExternalExecutionV125,
} from "@receiz/sdk";

export async function planNotification(input: {
  recipientHead: string;
  templateHead: string;
  selectedKai: string;
}) {
  const plan = await planReceizExternalExecutionV125({
    profile: RECEIZ_NOTIFICATION_EXECUTION_PROFILE_V125,
    operationId: "example.notification",
    request: { templateId: "example.receipt-ready" },
    proofHeads: { recipient: input.recipientHead, template: input.templateHead },
    idempotencyKey: "example.notification.receipt-ready",
  });
  return { plan, runtime: createReceizExternalExecutionRuntimeV125() };
}
