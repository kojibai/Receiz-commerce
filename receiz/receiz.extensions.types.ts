// @receiz-generated receiz.app.contract.v1
// Regenerate with receiz app apply; do not edit directly.

export type ReceizExtensionOperation = Readonly<{ rail: string; operation: string }>;
export type ReceizExtensionProjection = Readonly<{ rail: string; value: unknown }>;
export interface ReceizProjectExtensions {
  beforeOperation?(operation: ReceizExtensionOperation): void | Promise<void>;
  afterProjection?(projection: ReceizExtensionProjection): void | Promise<void>;
}
