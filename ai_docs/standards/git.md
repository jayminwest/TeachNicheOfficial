# Git & GitHub Standards

## Branch Structure
```
main (production)
  ↳ staging
    ↳ dev
      ↳ feature/*
      ↳ bugfix/*
      ↳ hotfix/*
      ↳ release/*
```

## Branch Naming Conventions

### Format
`<type>/<description>`

### Types
- `feature/` - New features (e.g., feature/video-upload)
- `bugfix/` - Non-critical fixes (e.g., bugfix/login-validation)
- `hotfix/` - Critical production fixes (e.g., hotfix/security-patch)
- `release/` - Release preparation (e.g., release/v1.2.0)
- `docs/` - Documentation updates (e.g., docs/api-reference)
- `refactor/` - Code refactoring (e.g., refactor/auth-flow)

### Description
- Use kebab-case
- Be concise but descriptive
- Include issue number if applicable (e.g., feature/video-upload-#123)

## Commit Messages

### Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- feat: New feature
- fix: Bug fix
- docs: Documentation changes
- style: Formatting changes
- refactor: Code restructuring
- test: Adding/modifying tests
- chore: Maintenance tasks

### Guidelines
- Subject line limited to 72 characters
- Use present tense ("add feature" not "added feature")
- Body explains what and why, not how
- Reference issues in footer

### Examples
```
feat(auth): implement OAuth login with Google

Add Google OAuth authentication option to improve user signup experience.
Includes error handling and redirect flows.

Closes #123
```

## Pull Requests

### Title Format
`[Type] Description (#issue)`

### Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Feature
- [ ] Bug Fix
- [ ] Documentation
- [ ] Refactor

## Testing
- [ ] Unit Tests Added
- [ ] Integration Tests Added
- [ ] Manual Testing Completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Comments added where needed
- [ ] Documentation updated
- [ ] Tests passing
```

### Review Process
1. Self-review completed
2. Tests passing
3. Documentation updated
4. PR template filled
5. Requested reviewers
6. Addressed feedback

## Protected Branches

### Main Branch
- Requires pull request
- Requires approvals (2 minimum)
- Requires passing CI
- No direct pushes
- Linear history required

### Dev Branch
- Requires pull request
- Requires 1 approval
- Requires passing CI
- No direct pushes

## Common Workflows

### Feature Development
```bash
# Create feature branch
git checkout dev
git pull origin dev
git checkout -b feature/new-feature

# Regular commits
git add .
git commit -m "feat(scope): description"

# Push and create PR
git push -u origin feature/new-feature
```

### Bug Fixes
```bash
# Create bugfix branch
git checkout dev
git pull origin dev
git checkout -b bugfix/issue-123

# Fix and commit
git add .
git commit -m "fix(scope): description"

# Push and create PR
git push -u origin bugfix/issue-123
```

### Hotfixes
```bash
# Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-fix

# Fix, commit, and push
git add .
git commit -m "fix(scope): description"
git push -u origin hotfix/critical-fix
```

## Best Practices

1. Keep branches short-lived
2. Rebase feature branches regularly
3. Write meaningful commit messages
4. Create focused, reviewable PRs
5. Delete merged branches
6. Keep linear history
7. Never force push to protected branches
8. Always pull before starting work

## Git Hooks

### Pre-commit
- Lint staged files
- Run type checks
- Run unit tests
- Check commit message format

### Pre-push
- Run full test suite
- Check build
- Verify branch naming

## Continuous Integration

### Checks Required
- Type checking
- Linting
- Unit tests
- Integration tests
- Build verification
- Coverage thresholds

### Automated Processes
- PR labeling
- Branch protection
- Status checks
- Deployment previews

## Release Process

1. Create release branch
```bash
git checkout dev
git checkout -b release/v1.0.0
```

2. Version bump and changelog
```bash
npm version 1.0.0
git add .
git commit -m "chore(release): v1.0.0"
```

3. Merge to main
```bash
git checkout main
git merge release/v1.0.0
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin main --tags
```

4. Merge back to dev
```bash
git checkout dev
git merge release/v1.0.0
git push origin dev
```

## Troubleshooting

### Common Issues
1. Merge Conflicts
   - Pull latest changes
   - Rebase if necessary
   - Resolve conflicts locally
   - Test after resolution

2. Failed CI
   - Check logs
   - Run tests locally
   - Fix issues
   - Push updates

3. Branch Management
   - Keep branches updated
   - Delete stale branches
   - Use correct base branch
   - Follow naming conventions

## Support

- Review this documentation
- Check commit history
- Use PR templates
- Ask for help when needed
