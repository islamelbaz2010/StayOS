# Folder Conventions - StayOS

**Version**: 1.0.0  
**Last Updated**: 2026-07-12  
**Maintainer**: Technical Lead  
**Status**: Active

## 📋 Document Purpose

This document establishes folder and directory naming conventions for the StayOS project to ensure consistency and maintainability.

## 🎯 General Principles

### 1. Consistency

- Use consistent naming across the project
- Follow established patterns
- Maintain uniform structure
- Respect existing conventions

### 2. Clarity

- Use descriptive names
- Avoid abbreviations
- Make structure self-explanatory
- Group related items together

### 3. Brevity

- Keep names concise but clear
- Avoid overly long names
- Balance brevity with clarity
- Use context to shorten names

## 📁 Naming Conventions

### Directory Names

- Use lowercase letters
- Use hyphens to separate words (kebab-case)
- Use singular form for directories
- Avoid spaces and special characters

**Examples:**
```
src/
docs/
tests/
kernel/
user-space/
network-stack/
```

### File Names

- Use lowercase letters
- Use hyphens to separate words (kebab-case)
- Use descriptive names
- Match file type conventions

**Examples:**
```
window-manager.rs
file-system.cpp
installation-guide.md
build-config.json
```

## 📂 Project Structure

### Root Level

```
StayOS/
├── .github/              # GitHub configuration
├── docs/                 # Documentation
├── src/                  # Source code
├── tests/                # Test files
├── scripts/              # Utility scripts
├── tools/                # Development tools
├── business/             # Business documentation
├── research/             # Research documentation
├── ai_agents/            # AI agent documentation
├── .gitignore            # Git ignore rules
├── CODEOWNERS            # Code ownership
├── LICENSE               # License file
├── README.md             # Project README
├── CONTRIBUTING.md       # Contribution guide
└── [other root files]    # Other project files
```

### Source Code Structure

```
src/
├── kernel/               # Kernel code
│   ├── mod.rs
│   ├── scheduler.rs
│   ├── memory.rs
│   └── [other kernel modules]
├── userspace/            # User space code
│   ├── mod.rs
│   ├── services/
│   ├── applications/
│   └── [other userspace modules]
├── ui/                   # UI framework
│   ├── mod.rs
│   ├── window.rs
│   ├── components/
│   └── [other UI modules]
├── network/              # Network stack
│   ├── mod.rs
│   ├── tcp.rs
│   ├── udp.rs
│   └── [other network modules]
├── storage/              # Storage and file system
│   ├── mod.rs
│   ├── fs.rs
│   ├── drivers/
│   └── [other storage modules]
├── security/             # Security components
│   ├── mod.rs
│   ├── auth.rs
│   ├── crypto/
│   └── [other security modules]
├── api/                  # API definitions
│   ├── mod.rs
│   ├── kernel-api.rs
│   ├── user-api.rs
│   └── [other API modules]
└── common/               # Shared code
    ├── mod.rs
    ├── utils.rs
    └── [other common modules]
```

### Documentation Structure

```
docs/
├── architecture/         # Architecture documentation
│   ├── adr/             # Architecture Decision Records
│   ├── README.md        # Architecture overview
│   └── [other architecture docs]
├── development/          # Development guides
│   ├── environment.md   # Development environment setup
│   ├── testing.md       # Testing guidelines
│   ├── workflow.md      # Development workflow
│   └── [other development docs]
├── standards/            # Standards and conventions
│   ├── documentation_guide.md
│   ├── markdown_standards.md
│   ├── repository_standards.md
│   ├── naming_conventions.md
│   ├── commit_conventions.md
│   ├── folder_conventions.md
│   └── [other standards]
├── templates/            # Documentation templates
│   ├── installation_guide.md
│   ├── user_guide.md
│   ├── api_reference.md
│   ├── architecture_doc.md
│   ├── development_guide.md
│   ├── tutorial.md
│   └── [other templates]
├── user/                # User documentation
│   ├── installation.md
│   ├── getting_started.md
│   ├── features/
│   └── [other user docs]
├── api/                 # API documentation
│   ├── kernel.md
│   ├── ui.md
│   ├── platform.md
│   └── [other API docs]
└── images/              # Documentation images
    ├── diagrams/
    ├── screenshots/
    └── [other images]
```

### Test Structure

```
tests/
├── unit/                # Unit tests
│   ├── kernel/
│   ├── ui/
│   ├── network/
│   └── [other unit tests]
├── integration/         # Integration tests
│   ├── kernel/
│   ├── ui/
│   ├── network/
│   └── [other integration tests]
├── e2e/                # End-to-end tests
│   ├── scenarios/
│   └── [other e2e tests]
└── fixtures/            # Test fixtures
    ├── data/
    └── [other fixtures]
```

### GitHub Structure

```
.github/
├── ISSUE_TEMPLATE/      # Issue templates
│   ├── bug_report.md
│   ├── feature_request.md
│   ├── documentation.md
│   └── [other templates]
├── PULL_REQUEST_TEMPLATE/
│   └── pr_template.md
├── workflows/           # CI/CD workflows
│   ├── ci.yml
│   ├── release.yml
│   ├── security.yml
│   ├── docs.yml
│   └── [other workflows]
└── labels/              # Label documentation
    └── labels.md
```

### Business Structure

```
business/
├── financial/           # Financial documentation
│   ├── financial_model_template.md
│   ├── [other financial docs]
├── product/             # Product documentation
│   ├── product_template.md
│   ├── [other product docs]
├── roadmap/             # Roadmap documentation
│   ├── roadmap_template.md
│   ├── [other roadmap docs]
└── sprint/              # Sprint documentation
    ├── sprint_template.md
    └── [other sprint docs]
```

### Research Structure

```
research/
├── market/              # Market research
│   ├── market_research_template.md
│   ├── [other market research]
├── competitor/          # Competitor research
│   ├── competitor_research_template.md
│   ├── [other competitor research]
├── interviews/          # Interview documentation
│   ├── interview_template.md
│   ├── [other interviews]
├── feature_evaluation/  # Feature evaluation
│   ├── feature_evaluation_template.md
│   ├── [other evaluations]
└── risk/                # Risk assessment
    ├── risk_template.md
    └── [other risk assessments]
```

## 🎯 Special Conventions

### Module Files

- Use `mod.rs` for directory modules
- Keep `mod.rs` focused on re-exports
- Use descriptive file names for modules

### Test Files

- Name test files after the module they test
- Use `_test.rs` suffix for test files
- Place tests in `tests/` directory

### Configuration Files

- Use descriptive names
- Use appropriate extensions (.json, .yaml, .toml)
- Place in root or appropriate subdirectory

### Script Files

- Use descriptive names
- Use appropriate extensions (.sh, .py, .rs)
- Place in `scripts/` directory

## 🚨 Common Mistakes

### Avoid These

1. **Inconsistent casing**: Don't mix kebab-case and camelCase
2. **Spaces in names**: Never use spaces in file/directory names
3. **Abbreviations**: Don't use unclear abbreviations
4. **Deep nesting**: Avoid overly deep directory structures
5. **Generic names**: Avoid generic names like "data", "stuff"
6. **Mixed separators**: Don't mix hyphens and underscores
7. **Capital letters**: Don't use capital letters in file/directory names

## 📞 Contact

For questions about folder conventions, contact:

- **Technical Lead**: tech-lead@stayos.dev
- **GitHub**: @islamelbaz2010

---

**Consistent folder structure improves project organization and maintainability. Follow these conventions for all directories and files.**
