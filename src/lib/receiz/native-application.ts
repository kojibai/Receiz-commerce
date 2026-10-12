/** The public registered client coordinate is configuration, not authority.
 * Do not normalize it or use the store/subject name as an application ID.
 * Historical recovery keeps the exact ID already carried by its source. */
export function nativePaymentApplicationId() {
  const applicationId = process.env.RECEIZ_CLIENT_ID;
  if (!applicationId || applicationId !== applicationId.trim()) throw new Error("receiz_registered_client_id_required");
  return applicationId;
}
