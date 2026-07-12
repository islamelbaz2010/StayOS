# Commit Conventions - StayOS

**Version**: 1.0.0  
**Last Updated**: 2026-07-12  
**Maintainer**: Technical Lead  
**Status**: Active

## 📋 Document Purpose

This document establishes commit message conventions for the StayOS project. Consistent commit messages improve readability, enable automated changelog generation, and facilitate collaboration.

## 🎯 Commit Message Format

We follow the Conventional Commits specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

## 📝 Commit Types

### Type Definitions

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **build**: Build system or dependency changes
- **ci**: CI/CD configuration changes
- **chore**: Other changes that don't fit above
- **revert**: Revert a previous commit

### Type Guidelines

- Use only the defined types
- Use lowercase for types
- One type per commit
- Choose the most appropriate type

## 🎯 Scope

### Scope Definition

The scope provides context about the commit:

```
feat(kernel): add process scheduler
fix(ui): resolve memory leak in window manager
docs(api): update authentication endpoints
```

### Common Scopes

- **kernel**: Kernel-related changes
- **ui**: UI framework changes
- **network**: Network stack changes
- **storage**: File system and storage changes
- **security**: Security-related changes
- **api**: API changes
- **build**: Build system changes
- **tests**: Test changes
- **docs**: Documentation changes

### Scope Guidelines

- Use lowercase for scopes
- Use singular form (kernel, not kernels)
- Omit scope if not applicable
- Be consistent with existing scopes

## 📝 Description

### Description Guidelines

- Use imperative mood ("add" not "added")
- Use lowercase
- Don't end with a period
- Be concise but descriptive
- Limit to 72 characters

### Good Examples

```
feat(kernel): add process scheduler
fix(ui): resolve memory leak in window manager
docs(api): update authentication endpoints
refactor(network): improve TCP implementation
```

### Bad Examples

```
feat(kernel): Added process scheduler (wrong mood)
fix(ui): memory leak (too vague)
docs(api): updated authentication endpoints (wrong mood)
refactor(network): improved TCP implementation (wrong mood)
```

## 📄 Body

### Body Guidelines

- Use for detailed explanations
- Wrap at 72 characters
- Use imperative mood
- Explain what and why, not how
- Include references to issues

### Body Example

```
feat(kernel): add process scheduler

Implement a priority-based process scheduler with support for
multiple scheduling policies. The scheduler uses a red-black tree
for efficient priority queue operations.

This addresses #123 and improves system responsiveness under load.

Closes #123
```

## 🔗 Footer

### Footer Guidelines

- Use for metadata and references
- Include issue references
- Include breaking change notices
- Separate from body with blank line

### Issue References

```
Closes #123
Fixes #456
Refs #789
Related to #101
```

### Breaking Changes

```
feat(api): change authentication endpoint

BREAKING CHANGE: Authentication endpoint now requires JWT token
instead of API key. Update all clients accordingly.
```

## 📚 Examples

### Feature Commit

```
feat(kernel): add process scheduler

Implement a priority-based process scheduler with support for
multiple scheduling policies. The scheduler uses a red-black tree
for efficient priority queue operations.

Closes #123
```

### Bug Fix Commit

```
fix(ui): resolve memory leak in window manager

Fixed memory leak where window resources were not properly
released when windows were closed. This caused gradual memory
increase over time.

Fixes #456
```

### Documentation Commit

```
docs(api): update authentication endpoints

Updated API documentation to reflect new JWT-based authentication
system. Added examples and error handling information.

Refs #789
```

### Refactor Commit

```
refactor(network): improve TCP implementation

Refactored TCP implementation to use state machine pattern.
This improves code organization and makes it easier to add
new features.

No functional changes.
```

### Test Commit

```
test(kernel): add unit tests for memory manager

Added comprehensive unit tests for memory manager including
edge cases and error conditions. Coverage increased from 60% to 85%.

Related to #101
```

## 🚨 Common Mistakes

### Avoid These

1. **Wrong mood**: Use imperative, not past tense
2. **Too vague**: Be specific about what changed
3. **Too long**: Keep description under 72 characters
4. **Missing type**: Always include a type
5. **Inconsistent casing**: Use lowercase for type and scope
6. **Period at end**: Don't end description with period
7. **Generic messages**: Avoid "update", "fix", "changes"

### Bad Examples

```
# Wrong mood
feat(kernel): added process scheduler

# Too vague
fix(ui): memory leak

# Too long
feat(kernel): implement a very complex process scheduler with many features

# Missing type
process scheduler added

# Inconsistent casing
Feat(Kernel): Add Process Scheduler

# Period at end
feat(kernel): add process scheduler.

# Generic message
fix: update
```

## 🛠️ Tools

### Commitlint

Use commitlint to enforce commit message standards:

```bash
npm install -g @commitlint/cli @commitlint/config-conventional
echo "module.exports = {extends: ['@commitlint/config-conventional']}" > commitlint.config.js
```

### Git Hooks

Add commit message hook:

```bash
#!/bin/bash
# .git/hooks/commit-msg
commitlint --edit $1
```

### Commitizen

Use commitizen for interactive commit messages:

```bash
npm install -g commitizen cz-conventional-changelog
echo '{"path":"cz-conventional-changelog"}' > .czrc
commitizen init cz-conventional-changelog --save-dev --save-exact
```

## 📊 Changelog Generation

Commit conventions enable automated changelog generation:

```bash
npm install -g conventional-changelog-cli
conventional-changelog -p angular -i CHANGELOG.md -s
```

## 🎯 Best Practices

### Commit Frequency

- Commit often with small, focused changes
- One logical change per commit
- Don't commit broken code
- Test before committing

### Commit Content

- Include tests with code changes
- Update documentation with API changes
- Don't include unrelated changes
- Remove debug code before committing

### Commit Messages

- Write messages for future you
- Explain why, not just what
- Reference related issues
- Keep messages consistent

## 📞 Contact

For questions about commit conventions, contact:

- **Technical Lead**: tech-lead@stayos.dev
- **GitHub**: @islamelbaz2010

---

**Consistent commit messages improve collaboration and enable automation. Follow these conventions for all commits.**
