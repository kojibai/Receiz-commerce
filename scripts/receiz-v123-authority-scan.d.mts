export type ReceizV123AuthorityFinding = Readonly<{
  code: string;
  path: string;
  blocking: true;
  authority: "sealed-receiz-proof-object";
}>;

export function scanReceizV123Authority(source: string, path: string): ReceizV123AuthorityFinding[];

export function scanReceizV123Repository(root?: string): Readonly<{
  schema: "receiz.v123.authority-scan.v1";
  ok: boolean;
  findings: readonly ReceizV123AuthorityFinding[];
  authority: Readonly<{
    scannerIsProofAuthority: false;
    strongerTruth: "sealed-receiz-proof-object";
  }>;
}>;
