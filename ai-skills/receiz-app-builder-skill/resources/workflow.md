# App Contract Workflow

| Need | Read-only action | Confirmed mutation |
|---|---|---|
| New app | `receiz_app_contract_create`, `receiz_app_plan` | `receiz_app_apply` |
| Existing repository | `receiz_project_inspect`, `receiz_app_plan` | Apply the confirmed preview |
| Add or remove a rail | Update the contract, then plan | Apply only the changed digest |
| Upgrade | `receiz_app_upgrade` | Apply approved package/generated changes |
| Diagnose | `receiz_app_check`, `receiz_app_explain` | None until the finding is understood |
| Repair | `receiz_app_repair` preview | Exact digest confirmation; regenerate Receiz-owned files only |

After every mutation, run the returned verification commands and reinspect.
The same repository must produce zero changes on the second run.
Preserve the developer-owned `receiz.extensions.ts` sibling on every run. Finish with `receiz conformance` or `receiz_release_qualify`.

Do not substitute inspection for verification, publication for settlement, or a
successful write for proof admission.
