# Naming Conventions - StayOS

**Version**: 1.0.0  
**Last Updated**: 2026-07-12  
**Maintainer**: Technical Lead  
**Status**: Active

## 📋 Document Purpose

This document establishes naming conventions for all aspects of the StayOS project, including files, directories, variables, functions, and more. Consistent naming improves readability and maintainability.

## 🎯 General Principles

### 1. Clarity

- Names should be self-descriptive
- Avoid abbreviations unless widely known
- Use full words instead of contractions
- Names should reveal intent

### 2. Consistency

- Use the same naming pattern across the codebase
- Follow language-specific conventions
- Maintain consistency within modules
- Respect existing patterns

### 3. Brevity

- Be concise but clear
- Avoid overly long names
- Balance brevity with clarity
- Use context to shorten names

## 🦀 Rust Naming Conventions

### Variables and Functions

```rust
// Use snake_case for variables and functions
let user_name = "Alice";
let total_count = 42;

fn calculate_total(items: &[Item]) -> u64 {
    // Implementation
}

fn get_user_by_id(id: u64) -> Option<User> {
    // Implementation
}
```

### Types

```rust
// Use PascalCase for types
struct Window {
    title: String,
    width: u32,
    height: u32,
}

enum Color {
    Red,
    Green,
    Blue,
}

trait Drawable {
    fn draw(&self);
}

type UserId = u64;
```

### Constants

```rust
// Use SCREAMING_SNAKE_CASE for constants
const MAX_WINDOW_WIDTH: u32 = 4096;
const DEFAULT_TIMEOUT_MS: u64 = 5000;
const API_VERSION: &str = "1.0.0";
```

### Modules

```rust
// Use snake_case for modules
mod window_manager;
mod file_system;
mod network_stack;

// Module files
// window_manager.rs
// file_system.rs
// network_stack.rs
```

### Lifetime Parameters

```rust
// Use short, descriptive names
fn parse<'input>(data: &'input str) -> Result<Parsed, Error> {
    // Implementation
}

struct Context<'a> {
    data: &'a str,
}
```

### Generic Type Parameters

```rust
// Use single uppercase letters or descriptive names
fn process<T>(item: T) -> T {
    // Implementation
}

struct Container<K, V> {
    key: K,
    value: V,
}
```

## 🔧 C++ Naming Conventions

### Variables

```cpp
// Use snake_case for variables
int user_count = 0;
std::string window_title = "My Window";
bool is_valid = true;

// Use trailing_underscore_ for member variables
class Window {
private:
    std::string title_;
    int width_;
    int height_;
};
```

### Functions

```cpp
// Use snake_case for functions
void calculate_total(const std::vector<Item>& items);
User* get_user_by_id(int id);
bool is_valid() const;
```

### Types

```cpp
// Use PascalCase for types
class WindowManager {
    // Implementation
};

struct WindowConfig {
    std::string title;
    int width;
    int height;
};

enum class Color {
    Red,
    Green,
    Blue
};
```

### Constants

```cpp
// Use kPascalCase or SCREAMING_SNAKE_CASE for constants
const int kMaxWindowWidth = 4096;
const int DEFAULT_TIMEOUT_MS = 5000;
const std::string API_VERSION = "1.0.0";
```

### Namespaces

```cpp
// Use snake_case for namespaces
namespace stayos {
namespace kernel {
namespace scheduler {
    // Implementation
}
}
}
```

## 📁 File Naming Conventions

### Source Files

```
# Rust files
window_manager.rs
file_system.rs
network_stack.rs

# C++ files
window_manager.cpp
window_manager.h
file_system.cpp
file_system.h

# Use snake_case for all source files
```

### Documentation Files

```
# Use kebab-case for documentation files
installation-guide.md
user-guide.md
api-reference.md
architecture-overview.md

# Use index.md for directory indexes
docs/
├── index.md
├── installation/
│   └── index.md
└── api/
    └── index.md
```

### Configuration Files

```
# Use kebab-case for configuration files
stayos-config.json
build-settings.yaml
ci-cd-config.yml
```

### Test Files

```
# Rust test files
window_manager_test.rs
file_system_test.rs

# Or use tests module within source file
// window_manager.rs
#[cfg(test)]
mod tests {
    // Tests
}

# C++ test files
window_manager_test.cpp
file_system_test.cpp
```

## 📂 Directory Naming Conventions

### Source Directories

```
src/
├── kernel/           # snake_case
├── userspace/        # snake_case
├── ui/              # snake_case
└── common/          # snake_case
```

### Documentation Directories

```
docs/
├── architecture/    # snake_case
├── development/     # snake_case
├── standards/       # snake_case
└── user/           # snake_case
```

### Test Directories

```
tests/
├── unit/           # snake_case
├── integration/    # snake_case
└── e2e/           # snake_case
```

## 🏷️ Git Naming Conventions

### Branch Names

```
# Use kebab-case with prefixes
feature/window-manager
bugfix/memory-leak
hotfix/security-patch
refactor/api-layer
docs/installation-guide
test/kernel-tests
```

### Commit Messages

```
# Use conventional commits with imperative mood
feat(kernel): add process scheduler
fix(ui): resolve memory leak in window manager
docs(api): update authentication endpoints
test(kernel): add unit tests for memory management
refactor(network): improve TCP implementation
```

### Tag Names

```
# Use semantic versioning
v0.1.0-alpha
v0.1.0-beta
v0.1.0
v1.0.0
```

## 🔌 API Naming Conventions

### Endpoints

```
# Use kebab-case for URL paths
GET /api/v1/windows
POST /api/v1/windows
GET /api/v1/windows/{id}
DELETE /api/v1/windows/{id}

# Use snake_case for query parameters
GET /api/v1/windows?sort_by=title&order=asc
```

### JSON Keys

```
# Use snake_case for JSON keys
{
  "window_id": "123",
  "window_title": "My Window",
  "window_width": 800,
  "window_height": 600,
  "created_at": "2026-07-12T00:00:00Z"
}
```

## 🗄️ Database Naming Conventions

### Table Names

```
# Use snake_case for table names
users
windows
permissions
user_permissions
```

### Column Names

```
# Use snake_case for column names
user_id
window_title
created_at
updated_at
is_active
```

### Index Names

```
# Use descriptive names with prefixes
idx_users_email
idx_windows_user_id
idx_permissions_resource
```

## 🎨 UI Component Naming

### Component Names

```
# Use PascalCase for component names
Window
Button
TextField
MenuBar
```

### Component Files

```
# Use PascalCase for component files
Window.rs
Button.rs
TextField.rs
MenuBar.rs
```

### CSS Classes

```
# Use kebab-case for CSS classes
.window-container
.button-primary
.text-field-input
.menu-bar
```

## 🔧 Configuration Naming

### Environment Variables

```
# Use SCREAMING_SNAKE_CASE with prefix
STAYOS_LOG_LEVEL
STAYOS_DATABASE_URL
STAYOS_API_KEY
STAYOS_MAX_CONNECTIONS
```

### Configuration Keys

```
# Use snake_case for configuration keys
log.level
database.url
api.key
max.connections
```

## 📝 Documentation Naming

### Document Titles

```
# Use Title Case for document titles
# Window Management Guide
# Installation Instructions
# API Reference Documentation
```

### Section Headers

```
# Use Sentence Case for section headers
## Creating a window
## Installing StayOS
## Authentication endpoints
```

## 🚨 Common Mistakes

### Avoid These

1. **Inconsistent casing**: Don't mix snake_case and camelCase
2. **Abbreviations**: Don't use unclear abbreviations (e.g., `usr_nm` vs `user_name`)
3. **Single letters**: Don't use single letters except for loop variables
4. **Hungarian notation**: Don't use type prefixes (e.g., `strName`, `intCount`)
5. **Magic numbers**: Use named constants instead
6. **Generic names**: Avoid generic names like `data`, `info`, `temp`
7. **Misleading names**: Names should accurately describe what they represent

## 📚 Examples

### Good Examples

```rust
// Clear, descriptive names
let active_window_count = get_active_window_count();
fn calculate_window_area(width: u32, height: u32) -> u32 {
    width * height
}
const MAX_WINDOW_WIDTH: u32 = 4096;

struct WindowConfig {
    title: String,
    width: u32,
    height: u32,
}
```

### Bad Examples

```rust
// Unclear, non-descriptive names
let n = get_win_cnt();
fn calc(w: u32, h: u32) -> u32 {
    w * h
}
const MAX: u32 = 4096;

struct WC {
    t: String,
    w: u32,
    h: u32,
}
```

## 📞 Contact

For questions about naming conventions, contact:

- **Technical Lead**: tech-lead@stayos.dev
- **GitHub**: @islamelbaz2010

---

**Consistent naming conventions make code more readable and maintainable. Follow these conventions and help improve them over time.**
