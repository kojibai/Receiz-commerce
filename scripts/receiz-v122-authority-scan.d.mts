export type ReceizV122AuthorityFinding = Readonly<{
  code: string;
  path: string;
  blocking: true;
  authority: "sealed-receiz-proof-object";
}>;

export function scanReceizV122Authority(source: string, path: string): ReceizV122AuthorityFinding[];

export function scanReceizV122Repository(root?: string): Readonly<{
  schema: "receiz.v122.authority-scan.v1";
  ok: boolean;
  findings: readonly ReceizV122AuthorityFinding[];
  authority: Readonly<{
    scannerIsProofAuthority: false;
    strongerTruth: "sealed-receiz-proof-object";
  }>;
}>;
