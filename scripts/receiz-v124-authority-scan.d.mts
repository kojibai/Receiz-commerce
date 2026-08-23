export type ReceizV124AuthorityFinding = Readonly<{ code: string; path: string; blocking: true; authority: "sealed-receiz-proof-object" }>;
export function scanReceizV124Authority(source: string, path: string): ReceizV124AuthorityFinding[];
export function scanReceizV124Repository(root?: string): Readonly<{
  schema: "receiz.v124.authority-scan.v1";
  ok: boolean;
  findings: readonly ReceizV124AuthorityFinding[];
}>;
