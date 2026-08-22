# Security policy

## Supported documentation

Security corrections are accepted for the current V2 documentation and for the documentation application itself. V1 describes a legacy API generation and normally receives only corrections for dangerous or misleading guidance.

## Report a vulnerability privately

Use GitHub's **Report a vulnerability** option in the Security tab of this repository. Do not open a public issue for suspected vulnerabilities, exposed credentials, private data, or deployment weaknesses.

Include the affected route or file, reproduction details, expected impact, and any suggested remediation. Maintainers will acknowledge a complete report as soon as practical and coordinate disclosure after remediation.

## Accidental disclosure

If a token or private value is committed, revoke or rotate it immediately. Removing a value from the latest commit is not sufficient because Git history, forks, caches, logs, and artifacts may retain it.
