import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createReceizCommerceAdapter } from "../src/lib/receiz/adapter";
import {
  parseReceizNamespaceResolutionV123,
  planReceizWorldCommandCanonicalV123,
  planReceizWorldTransactionCanonicalV123,
} from "../src/lib/receiz/v123/planning";

const hash = (character: string) => character.repeat(64);
const commandInput = {
  commandId: "command-1",
  worldId: "wilds",
  expectedWorldHead: hash("a"),
  actorSubjectId: "subject-a",
  participantSubjectIds: ["subject-a"],
  causalParents: [],
  command: { action: "move", x: 2, y: 3 },
  authority: { ownerHead: hash("b") },
};

describe("Receiz v123 canonical public planning", () => {
  it("allows the SDK alone to create command security values", async () => {
    const adapter = createReceizCommerceAdapter({ baseUrl: "https://receiz.invalid" });
    const plan = await planReceizWorldCommandCanonicalV123(adapter, commandInput);
    assert.match(plan.commandDigest, /^[0-9a-f]{64}$/);
    assert.match(plan.planDigest, /^[0-9a-f]{64}$/);
    assert.match(plan.authorityDigest, /^[0-9a-f]{64}$/);
    await assert.rejects(
      () => planReceizWorldCommandCanonicalV123(adapter, { ...commandInput, planDigest: hash("c") }),
      /SECURITY_VALUE_FORBIDDEN/,
    );
  });

  it("allows the SDK alone to create transaction identity and digest", async () => {
    const adapter = createReceizCommerceAdapter({ baseUrl: "https://receiz.invalid" });
    const command = await planReceizWorldCommandCanonicalV123(adapter, commandInput);
    const transaction = await planReceizWorldTransactionCanonicalV123(adapter, {
      worldId: "wilds",
      expectedWorldHead: hash("a"),
      participantHeads: { "subject-a": hash("b") },
      commands: [command],
      registryDigest: hash("c"),
      reducerDigest: hash("d"),
      idempotencyKey: "world-transaction-1",
    });
    assert.match(transaction.transactionId, /^receiz:world-transaction:[0-9a-f]{64}$/);
    assert.match(transaction.transactionDigest, /^[0-9a-f]{64}$/);
    await assert.rejects(
      () => planReceizWorldTransactionCanonicalV123(adapter, { ...transaction, transactionDigest: hash("e") }),
      /SECURITY_VALUE_FORBIDDEN/,
    );
  });

  it("requires exact subject head pins and normalized namespaces", () => {
    assert.deepEqual(parseReceizNamespaceResolutionV123({
      subjectId: `receiz:subject:${hash("1")}`,
      atHead: hash("2"),
      names: ["Inventory", "brain.memory", "inventory"],
    }), {
      subjectId: `receiz:subject:${hash("1")}`,
      atHead: hash("2"),
      names: ["brain.memory", "inventory"],
    });
    assert.throws(() => parseReceizNamespaceResolutionV123({ subjectId: "subject", atHead: "latest", names: ["inventory"] }), /EXACT_HEAD_REQUIRED/);
    assert.throws(() => parseReceizNamespaceResolutionV123({ subjectId: `receiz:subject:${hash("1")}`, atHead: hash("2"), names: ["inventory"], receipt: {} }), /AUTHORITY_FIELD_FORBIDDEN/);
  });
});
