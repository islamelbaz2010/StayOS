# Repository Standards - StayOS

**Version**: 1.0.0  
**Last Updated**: 2026-07-12  
**Maintainer**: Technical Lead  
**Status**: Active

## 📋 Document Purpose

This document establishes coding standards and conventions for the StayOS repository. These standards ensure code quality, maintainability, and consistency across the codebase.

## 🎯 General Principles

### 1. Readability

- Code should be self-documenting
- Use clear, descriptive names
- Write code for humans first, computers second
- Avoid clever code that's hard to understand

### 2. Consistency

- Follow existing patterns in the codebase
- Use consistent formatting
- Apply the same style across all files
- Respect the established conventions

### 3. Simplicity

- Favor simple solutions over complex ones
- Avoid premature optimization
- Keep functions short and focused
- Minimize nesting and complexity

### 4. Safety

- Use memory-safe languages where possible
- Handle errors explicitly
- Validate inputs
- Follow security best practices

## 🦀 Rust Standards

### Code Style

Follow the official Rust style guide:

```rust
// Use rustfmt for formatting
// Use clippy for linting

// Good: Clear, idiomatic Rust
pub fn calculate_total(items: &[Item]) -> u64 {
    items.iter().map(|item| item.price).sum()
}

// Bad: Unclear, non-idiomatic
pub fn calc(i: &Vec<Item>) -> u64 {
    let mut s = 0;
    for x in i {
        s = s + x.price;
    }
    s
}
```

### Naming Conventions

- **Functions**: snake_case
- **Variables**: snake_case
- **Types**: PascalCase
- **Constants**: SCREAMING_SNAKE_CASE
- **Modules**: snake_case

### Error Handling

```rust
// Use Result for recoverable errors
pub fn parse_config(path: &str) -> Result<Config, Error> {
    let content = fs::read_to_string(path)?;
    let config: Config = serde_json::from_str(&content)?;
    Ok(config)
}

// Use Option for optional values
pub fn get_user(id: u64) -> Option<User> {
    users.get(&id).cloned()
}
```

### Documentation

```rust
/// Creates a new window with the specified title and dimensions.
///
/// # Arguments
///
/// * `title` - The window title
/// * `width` - The window width in pixels
/// * `height` - The window height in pixels
///
/// # Returns
///
/// Returns a `Result` containing the window or an error.
///
/// # Examples
///
/// ```rust
/// let window = Window::new("My Window", 800, 600)?;
/// ```
pub fn new(title: &str, width: u32, height: u32) -> Result<Window, Error> {
    // Implementation
}
```

### Testing

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_window_creation() {
        let window = Window::new("Test", 800, 600).unwrap();
        assert_eq!(window.title(), "Test");
        assert_eq!(window.width(), 800);
    }

    #[test]
    fn test_invalid_dimensions() {
        let result = Window::new("Test", 0, 600);
        assert!(result.is_err());
    }
}
```

## 🔧 C++ Standards

### Code Style

```cpp
// Use modern C++ (C++17 or later)
// Use clang-format for formatting

// Good: Modern, safe C++
std::vector<int> calculate_totals(const std::vector<Item>& items) {
    std::vector<int> totals;
    totals.reserve(items.size());
    for (const auto& item : items) {
        totals.push_back(item.price);
    }
    return totals;
}

// Bad: Old-style, unsafe C++
int* calculate_totals(Item* items, int count) {
    int* totals = new int[count];
    for (int i = 0; i < count; i++) {
        totals[i] = items[i].price;
    }
    return totals;
}
```

### Naming Conventions

- **Functions**: snake_case
- **Variables**: snake_case
- **Types**: PascalCase
- **Constants**: kPascalCase or SCREAMING_SNAKE_CASE
- **Member variables**: trailing_underscore_

### Smart Pointers

```cpp
// Use smart pointers instead of raw pointers
std::unique_ptr<Window> create_window(const std::string& title) {
    return std::make_unique<Window>(title);
}

// Use std::shared_ptr for shared ownership
std::shared_ptr<Resource> get_shared_resource() {
    static auto resource = std::make_shared<Resource>();
    return resource;
}
```

## 📁 File Organization

### Directory Structure

```
src/
├── kernel/           # Kernel code
│   ├── mod.rs
│   ├── scheduler.rs
│   └── memory.rs
├── userspace/        # User space code
│   ├── mod.rs
│   ├── services/
│   └── applications/
├── ui/              # UI framework
│   ├── mod.rs
│   ├── window.rs
│   └── components/
└── common/          # Shared code
    ├── mod.rs
    └── utils.rs
```

### File Naming

- Use snake_case for file names
- One module per file
- Use `mod.rs` for directory modules
- Keep files under 500 lines when possible

### Imports

```rust
// Group imports by type
use std::collections::HashMap;
use std::fs::File;

use crate::kernel::scheduler;
use crate::ui::window;

use third_party::library;
```

## 🧪 Testing Standards

### Unit Tests

- Test individual functions and methods
- Use descriptive test names
- Test both success and failure cases
- Keep tests fast and independent

```rust
#[test]
fn test_calculate_total_with_empty_list() {
    let items = vec![];
    let total = calculate_total(&items);
    assert_eq!(total, 0);
}

#[test]
fn test_calculate_total_with_items() {
    let items = vec![
        Item { price: 100 },
        Item { price: 200 },
    ];
    let total = calculate_total(&items);
    assert_eq!(total, 300);
}
```

### Integration Tests

- Test component interactions
- Use realistic test data
- Test error scenarios
- Mock external dependencies

### Test Coverage

- Maintain >80% code coverage
- Focus on critical paths
- Test edge cases
- Review coverage regularly

## 🔒 Security Standards

### Input Validation

```rust
pub fn create_window(title: &str, width: u32, height: u32) -> Result<Window, Error> {
    if title.is_empty() {
        return Err(Error::InvalidTitle);
    }
    if width < 100 || width > 4096 {
        return Err(Error::InvalidWidth);
    }
    if height < 100 || height > 4096 {
        return Err(Error::InvalidHeight);
    }
    // Create window
}
```

### Error Handling

- Never silently ignore errors
- Use appropriate error types
- Provide meaningful error messages
- Log errors for debugging

### Memory Safety

- Use Rust's memory safety features
- Avoid unsafe code when possible
- Document unsafe code extensively
- Review unsafe code carefully

## 📊 Performance Standards

### Profiling

- Profile performance-critical code
- Identify bottlenecks
- Optimize based on data
- Document performance characteristics

### Optimization

- Don't optimize prematurely
- Focus on hot paths
- Measure before and after
- Consider trade-offs

### Resource Management

- Free resources explicitly
- Avoid memory leaks
- Limit resource usage
- Monitor resource consumption

## 📝 Code Review Standards

### Review Checklist

Before submitting code for review:

- [ ] Code follows style guidelines
- [ ] Code is well-documented
- [ ] Tests are included and passing
- [ ] Error handling is appropriate
- [ ] Security implications are considered
- [ ] Performance is acceptable
- [ ] No debug code or comments
- [ ] No commented-out code

### Review Process

- Self-review before requesting review
- Provide context in PR description
- Respond to feedback promptly
- Address all review comments
- Keep PRs focused and small

## 🛠️ Tooling

### Required Tools

- **rustfmt**: Code formatting
- **clippy**: Rust linting
- **clang-format**: C++ formatting
- **clang-tidy**: C++ linting
- **cargo-test**: Rust testing
- **cppunit**: C++ testing

### Pre-commit Hooks

```bash
#!/bin/bash
# Format code
cargo fmt
clang-format -i src/**/*.cpp

# Run linters
cargo clippy
clang-tidy src/**/*.cpp

# Run tests
cargo test
```

### CI/CD Integration

- Run formatting checks in CI
- Run linters in CI
- Run tests in CI
- Fail on violations

## 📚 Best Practices

### Functions

- Keep functions short (<50 lines)
- Single responsibility
- Descriptive names
- Clear parameters

### Comments

- Document why, not what
- Keep comments current
- Avoid obvious comments
- Use doc comments for public APIs

### Error Messages

- Be specific and helpful
- Include context
- Suggest fixes when possible
- Use consistent format

## 🚨 Anti-Patterns

### Avoid These

1. **Magic Numbers**: Use named constants
2. **Deep Nesting**: Refactor into functions
3. **Long Functions**: Break into smaller functions
4. **Global State**: Minimize use
5. **Copy-Paste Code**: Extract to functions
6. **Premature Optimization**: Profile first
7. **Ignoring Errors**: Handle explicitly
8. **Unsafe Code**: Use safe alternatives

## 📞 Contact

For questions about repository standards, contact:

- **Technical Lead**: tech-lead@stayos.dev
- **GitHub**: @islamelbaz2010

---

**Consistent code quality is essential for a maintainable codebase. Follow these standards and help improve them over time.**
