# Proof Verifier Starter Contract

Select `proof` and optionally `proofMemory`. Label byte-bearing inputs as payload
or sealed artifact. Route complete sealed files to SDK `artifacts.verifyAndOpen`
and domain parsers only to `opened.verifiedPayload.bytes`. MCP inspection and
repository checks never supply the verification verdict.
