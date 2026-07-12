# Contributing to StayOS

Thank you for your interest in contributing to StayOS! We welcome contributions from everyone, and this document will guide you through the process.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation Standards](#documentation-standards)
- [Pull Request Process](#pull-request-process)
- [Project Structure](#project-structure)
- [Getting Help](#getting-help)

## 🤝 Code of Conduct

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone, regardless of:

- Age
- Body size
- Disability
- Ethnicity
- Gender identity and expression
- Level of experience
- Nationality
- Personal appearance
- Race
- Religion
- Sexual identity and orientation

### Our Standards

Examples of behavior that contributes to a positive environment:

- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

### Unacceptable Behavior

Examples of unacceptable behavior:

- Harassment, trolling, or derogatory comments
- Personal or political attacks
- Public or private harassment
- Publishing others' private information without permission
- Other unethical or unprofessional conduct

## 🚀 Getting Started

### Prerequisites

Before contributing, ensure you have:

- A GitHub account
- Git installed and configured
- A compatible development environment (see [Development Guide](docs/development/environment.md))
- Familiarity with the project's documentation

### Setup

1. **Fork the Repository**
   ```bash
   # Fork https://github.com/islamelbaz2010/StayOS on GitHub
   # Then clone your fork
   git clone https://github.com/YOUR_USERNAME/StayOS.git
   cd StayOS
   ```

2. **Set Upstream Remote**
   ```bash
   git remote add upstream https://github.com/islamelbaz2010/StayOS.git
   ```

3. **Install Dependencies**
   ```bash
   ./scripts/setup.sh
   ```

4. **Verify Setup**
   ```bash
   make test
   ```

## 🔄 Development Workflow

### Branch Strategy

We use a simplified Git flow:

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - Feature branches
- `bugfix/*` - Bug fix branches
- `hotfix/*` - Critical production fixes

### Creating a Branch

```bash
# Ensure your main branch is up to date
git checkout main
git pull upstream main

# Create a new feature branch
git checkout -b feature/your-feature-name
```

### Making Changes

1. Write code following our [Coding Standards](#coding-standards)
2. Add tests for your changes
3. Update documentation as needed
4. Run the test suite: `make test`
5. Run linting: `make lint`

### Committing Changes

Follow our [Commit Conventions](docs/standards/commit_conventions.md):

```bash
# Good commit messages
git commit -m "feat(kernel): add process scheduler"
git commit -m "fix(ui): resolve memory leak in window manager"
git commit -m "docs(api): update authentication endpoints"
```

### Syncing with Upstream

```bash
# Fetch upstream changes
git fetch upstream

# Rebase your branch on upstream/main
git rebase upstream/main
```

## 📝 Coding Standards

### General Principles

- **Readability**: Code should be self-documenting
- **Simplicity**: Favor simple solutions over complex ones
- **Consistency**: Follow existing patterns in the codebase
- **Testing**: All code must have tests
- **Documentation**: Document public APIs and complex logic

### Language-Specific Guidelines

See [Repository Standards](docs/standards/repository_standards.md) for detailed language-specific guidelines.

### Code Review Checklist

Before submitting a PR, ensure:

- [ ] Code follows project style guidelines
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] Commit messages follow conventions
- [ ] No console.log or debug statements
- [ ] No commented-out code
- [ ] Code is self-documenting where appropriate

## 🧪 Testing Guidelines

### Test Requirements

- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test component interactions
- **End-to-End Tests**: Test critical user flows
- **Performance Tests**: For performance-critical code

### Running Tests

```bash
# Run all tests
make test

# Run specific test suite
make test-unit
make test-integration
make test-e2e

# Run with coverage
make test-coverage
```

### Writing Tests

- Follow the [Testing Guide](docs/development/testing.md)
- Use descriptive test names
- Test both success and failure cases
- Mock external dependencies
- Keep tests fast and independent

## 📚 Documentation Standards

### Documentation Requirements

- All public APIs must be documented
- Complex algorithms need explanations
- New features require user documentation
- Architectural decisions need ADRs

### Documentation Format

- Use Markdown for all documentation
- Follow [Markdown Standards](docs/standards/markdown_standards.md)
- Include code examples where helpful
- Use diagrams for complex systems

### Documentation Review

Documentation is reviewed as part of the code review process. Ensure:

- [ ] Spelling and grammar are correct
- [ ] Code examples are accurate
- [ ] Links are valid
- [ ] Formatting is consistent

## 🔀 Pull Request Process

### Before Submitting

1. **Update Documentation**
   - Update relevant documentation files
   - Add changelog entry if needed

2. **Run Full Test Suite**
   ```bash
   make test
   make lint
   ```

3. **Rebase with Upstream**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

### Submitting a PR

1. Push your branch to GitHub
   ```bash
   git push origin feature/your-feature-name
   ```

2. Create a Pull Request
   - Use the [PR Template](.github/PULL_REQUEST_TEMPLATE/pr_template.md)
   - Fill in all required sections
   - Link related issues

3. Wait for Review
   - Address review feedback
   - Keep the PR updated
   - Respond to comments promptly

### PR Review Process

- Automated checks must pass
- At least one maintainer approval required
- All discussions must be resolved
- CI/CD pipeline must be green

### After Merge

- Delete your feature branch
- Sync your local main branch
- Celebrate your contribution! 🎉

## 📁 Project Structure

```
StayOS/
├── .github/                 # GitHub configuration
│   ├── ISSUE_TEMPLATE/     # Issue templates
│   ├── PULL_REQUEST_TEMPLATE/
│   ├── workflows/          # CI/CD workflows
│   └── labels/             # Label documentation
├── docs/                   # Documentation
│   ├── architecture/       # Architecture docs
│   ├── development/        # Development guides
│   ├── standards/          # Coding and documentation standards
│   └── templates/          # Documentation templates
├── src/                    # Source code
│   ├── kernel/            # Kernel code
│   ├── userspace/         # User space code
│   └── drivers/           # Device drivers
├── tests/                  # Test files
├── scripts/                # Utility scripts
├── tools/                  # Development tools
├── business/              # Business documentation
│   ├── financial/
│   ├── product/
│   └── roadmap/
├── research/              # Research documentation
│   ├── market/
│   ├── competitor/
│   └── interviews/
└── ai_agents/             # AI agent documentation
```

## 🆘 Getting Help

### Resources

- [Documentation](docs/)
- [GitHub Issues](https://github.com/islamelbaz2010/StayOS/issues)
- [GitHub Discussions](https://github.com/islamelbaz2010/StayOS/discussions)
- [Master Context](MASTER_CONTEXT.md)

### Asking Questions

1. Search existing issues and discussions first
2. Use appropriate issue templates
3. Provide context and code examples
4. Be patient and respectful

### Reporting Bugs

Use the [Bug Report Template](.github/ISSUE_TEMPLATE/bug_report.md) and include:

- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Environment details
- Screenshots or logs if applicable

## 📋 Recognition

Contributors are recognized in:

- CONTRIBUTORS.md file
- Release notes
- Project website
- Annual contributor appreciation

## 🎯 Types of Contributions

We welcome:

- Bug fixes
- New features
- Documentation improvements
- Performance improvements
- Test coverage
- Translation
- Design improvements
- Security reports

## ⚖️ Licensing

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to StayOS! Your contributions help make StayOS better for everyone.

For questions, please open an issue or contact us at contributors@stayos.dev.
