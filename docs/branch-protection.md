# Branch Protection Setup (GitHub)

Use these rules on your default branch (`main`) so PRs cannot merge without passing quality gates.

## Required status checks

Mark these checks as required:

- Frontend Lint and Build
- Backend Unit Tests
- Docker Compose Health and Smoke E2E
- Playwright UI Smoke

## Recommended branch protection rules

- Require a pull request before merging
- Require approvals: 1 or more
- Dismiss stale pull request approvals when new commits are pushed
- Require status checks to pass before merging
- Require branches to be up to date before merging
- Require conversation resolution before merging
- Do not allow force pushes
- Do not allow deletions

## Path to configure

GitHub repository -> Settings -> Branches -> Add branch protection rule.

Pattern:
- `main`

## Optional advanced protections

- Require signed commits
- Require code owner reviews (when CODEOWNERS is configured)
- Restrict who can push to matching branches
