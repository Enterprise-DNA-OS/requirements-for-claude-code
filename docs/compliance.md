# Record checks and their sources

Checked 10 October 2026. This system checks the completeness and currency of records. It does not certify legal compliance, safety, software validation or fitness for a regulated product.

## Engineering review rules

[NASA Systems Engineering Handbook, requirements verification matrix](https://www.nasa.gov/reference/appendix-d-requirements-verification-matrix/) describes identifiable requirements, their source and verification evidence. It is engineering guidance, not a statutory requirement for an NZ or AU business. This build adopts the following local rules: each requirement has a source and verification method; active requirements have linked test procedures; readiness requires approval and current passing evidence from every linked active procedure. Changing either endpoint marks the link suspect. Changing a requirement or procedure invalidates old passing evidence. A human reviews the link and supplies a new test result where needed.

Missing owner and overdue review findings enforce the business's own deadlines, not a legal deadline. The record command validates evidence references as nonempty text; it cannot prove that an external file exists or the test was performed correctly. Approval requires body, source, owner and method. The operator supplies the reviewer and decision evidence.

## Personal information

[NZ Privacy Act principle 9](https://www.privacy.org.nz/privacy-principles/9/) concerns keeping personal information only while there is a lawful purpose. Set personal_data=true when a requirement or procedure contains it and choose a retention_review_on date under your policy. Missing or overdue dates trigger a purpose review. The date is a local reminder, not a statutory retention period. The command never deletes evidence automatically. Australian teams must configure their own applicable privacy rules before operational use.

## Access and evidence limits

RLS is enabled and public grants are revoked. Shared operation needs appropriate trusted database roles, backups, access controls and an agreed retention policy. Views use security_invoker. No public API or anonymous policy ships. Application history captures CLI changes, but database administrators can change it; use external immutable storage when required. Test results, baselines and drafts are records, not electronic signatures. No payments, payroll or regulated compliance service is supplied.
