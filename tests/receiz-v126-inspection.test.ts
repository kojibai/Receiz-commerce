import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { it } from "node:test";

it("limits inventory exceptions to exact published bytes and exact finding paths", async () => {
  const load = new Function("return import(process.cwd() + '/scripts/receiz-v127-inspection.mjs')") as () => Promise<{reviewPublishedInventoryFindings: (findings: unknown[], root?: string) => {reviewed: unknown[]; blocking: unknown[]}}>;
  const { reviewPublishedInventoryFindings: review } = await load();
  const root=mkdtempSync(join(tmpdir(),"receiz-inventory-"));
  const paths=["ai-skills/resources/sdk-public-functions.json","ai-skills/skills.json"];
  const finding={code:"weak_state_used_as_proof_authority",disposition:"unsafe_or_incompatible",affectedFiles:paths};
  try {
    mkdirSync(join(root,"ai-skills/resources"),{recursive:true});
    mkdirSync(join(root,"node_modules/@receiz/ai-skills/resources"),{recursive:true});
    for(const path of paths) {writeFileSync(join(root,path),"fixture");writeFileSync(join(root,"node_modules/@receiz",path),"fixture");}
    assert.equal(review([finding],root).reviewed.length,1);
    assert.equal(review([{...finding,affectedFiles:[...paths,"src/app.ts"]}],root).blocking.length,1);
    assert.equal(review([{...finding,code:"unexpected-finding"}],root).blocking.length,1);
    writeFileSync(join(root,paths[0]),"changed");
    assert.equal(review([finding],root).blocking.length,1);
  } finally {rmSync(root,{recursive:true,force:true});}
});

it("reviews only the exact published offline documentation migration action", async () => {
  const load = new Function("return import(process.cwd() + '/scripts/receiz-v127-inspection.mjs')") as () => Promise<{reviewPublishedInventoryActions: (actions: unknown[], root?: string) => {reviewed: unknown[]; blocking: unknown[]}}>;
  const { reviewPublishedInventoryActions: review } = await load();
  const action={code:"migrate_compiler_import",path:"ai-skills/resources/offline-sealing.md",disposition:"user_decision_required",risk:"medium",manualReview:true,destructive:false};
  assert.equal(review([action]).reviewed.length,1);
  assert.equal(review([{...action,path:"src/lib/receiz/adapter.ts"}]).blocking.length,1);
  assert.equal(review([{...action,destructive:true}]).blocking.length,1);
  assert.equal(review([{...action,code:"replace-file"}]).blocking.length,1);
});
