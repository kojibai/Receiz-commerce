export type ReceizActionClass = "read" | "preview" | "plan" | "stage" | "commit" | "projection";

export type ReceizAuthorityReport = Readonly<{
  primitive: string;
  actionClass: ReceizActionClass;
  source: string;
  mcpAuthority: false;
  proven: boolean;
  writes: 0 | 1;
  denialCode?: string;
}>;

export const projectionReport = (primitive: string, source: string): ReceizAuthorityReport => Object.freeze({
  primitive,
  actionClass: "projection",
  source,
  mcpAuthority: false,
  proven: false,
  writes: 0,
});

export const zeroWriteReport = (primitive: string, denialCode: string): ReceizAuthorityReport => Object.freeze({
  primitive,
  actionClass: "commit",
  source: "receiz-sdk",
  mcpAuthority: false,
  proven: false,
  writes: 0,
  denialCode,
});

export const admittedWriteReport = (primitive: string): ReceizAuthorityReport => Object.freeze({
  primitive,
  actionClass: "commit",
  source: "sealed-receiz-proof-object",
  mcpAuthority: false,
  proven: true,
  writes: 1,
});
