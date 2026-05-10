# Git Workflow

## Repository Defaults

- Default branch: `main`
- Merge style: squash or rebase preferred for feature branches
- Commit messages: clear imperative summaries
- PRs: use `.github/PULL_REQUEST_TEMPLATE.md`
- Ownership: use `.github/CODEOWNERS`

## Branch Names

- `codex/backend-<slug>`
- `codex/data-<slug>`
- `claude/ui-<slug>`
- `claude/design-<slug>`
- `qa/<slug>`

## Commit Guidance

Use concise, descriptive messages:

- `docs: add PetCura agent operating model`
- `data: add request lifecycle schema`
- `ui: build clinic inbox shell`
- `qa: add owner intake smoke test`

## Protected Branch Recommendation

Configure GitHub branch protection for `main`:

- require pull requests before merging
- require CODEOWNERS review
- require status checks once CI exists
- require conversation resolution
- block force pushes
- block branch deletion
- require linear history if the team prefers rebase/squash

Do not enable required status checks until the app scaffold and CI workflow exist.
