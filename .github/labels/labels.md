# GitHub Labels - StayOS

**Version**: 1.0.0  
**Last Updated**: 2026-07-12  
**Maintainer**: Project Lead  
**Status**: Active

## 📋 Document Purpose

This document defines the GitHub labels used in the StayOS repository for organizing issues and pull requests.

## 🏷️ Issue Labels

### Priority Labels

#### priority:critical

- **Color**: #d73a4a (red)
- **Description**: Critical priority issues that block progress or have severe impact
- **Usage**: Use for bugs that prevent core functionality or security vulnerabilities

#### priority:high

- **Color**: #ff7b72 (light red)
- **Description**: High priority issues that should be addressed soon
- **Usage**: Use for important bugs or high-value features

#### priority:medium

- **Color**: #ffa657 (orange)
- **Description**: Medium priority issues
- **Usage**: Use for standard bugs and features

#### priority:low

- **Color**: #fff8b5 (light yellow)
- **Description**: Low priority issues
- **Usage**: Use for minor bugs or nice-to-have features

### Type Labels

#### type:bug

- **Color**: #d73a4a (red)
- **Description**: Bug reports
- **Usage**: Use for all bug reports

#### type:feature

- **Color**: #a2eeef (light blue)
- **Description**: Feature requests
- **Usage**: Use for new feature proposals

#### type:enhancement

- **Color**: #84b6eb (blue)
- **Description**: Enhancement requests
- **Usage**: Use for improvements to existing features

#### type:documentation

- **Color**: #0075ca (dark blue)
- **Description**: Documentation issues
- **Usage**: Use for documentation updates or improvements

#### type:performance

- **Color**: #7057ff (purple)
- **Description**: Performance issues
- **Usage**: Use for performance-related bugs or improvements

#### type:security

- **Color**: #d73a4a (red)
- **Description**: Security issues
- **Usage**: Use for security vulnerabilities or security improvements

### Status Labels

#### status:needs-triage

- **Color**: #b60205 (dark red)
- **Description**: Issue needs initial triage
- **Usage**: Automatically applied to new issues

#### status:ready

- **Color**: #0e8a16 (green)
- **Description**: Issue is ready to be worked on
- **Usage**: Use after triage is complete

#### status:in-progress

- **Color**: #fbca04 (yellow)
- **Description**: Issue is currently being worked on
- **Usage**: Use when work has started

#### status:blocked

- **Color**: #e11d21 (red)
- **Description**: Issue is blocked by something else
- **Usage**: Use when work cannot proceed

#### status:on-hold

- **Color**: #cfd3d7 (gray)
- **Description**: Issue is on hold
- **Usage**: Use when work is paused

#### status:review

- **Color**: #5319e7 (purple)
- **Description**: Pull request is ready for review
- **Usage**: Use for PRs awaiting review

#### status:approved

- **Color**: #0e8a16 (green)
- **Description**: Pull request is approved
- **Usage**: Use for approved PRs

#### status:changes-requested

- **Color**: #fbca04 (yellow)
- **Description**: Changes requested on pull request
- **Usage**: Use when reviewer requests changes

### Component Labels

#### component:kernel

- **Color**: #006b75 (teal)
- **Description**: Kernel-related issues
- **Usage**: Use for kernel development

#### component:ui

- **Color**: #bfd4f2 (light blue)
- **Description**: UI framework issues
- **Usage**: Use for UI development

#### component:network

- **Color**: #5319e7 (purple)
- **Description**: Network stack issues
- **Usage**: Use for network development

#### component:storage

- **Color**: #fbca04 (yellow)
- **Description**: Storage and file system issues
- **Usage**: Use for storage development

#### component:security

- **Color**: #d93f0b (dark orange)
- **Description**: Security-related issues
- **Usage**: Use for security development

#### component:api

- **Color**: #0052cc (blue)
- **Description**: API-related issues
- **Usage**: Use for API development

#### component:build

- **Color**: #e99695 (light red)
- **Description**: Build system issues
- **Usage**: Use for build and CI/CD

#### component:documentation

- **Color**: #0075ca (dark blue)
- **Description**: Documentation issues
- **Usage**: Use for documentation

#### component:tests

- **Color**: #bfdadc (light teal)
- **Description**: Test-related issues
- **Usage**: Use for test development

### Size Labels

#### size:xs

- **Color**: #cfd3d7 (gray)
- **Description**: Extra small (less than 1 day)
- **Usage**: Use for very small tasks

#### size:s

- **Color**: #84b6eb (blue)
- **Description**: Small (1-2 days)
- **Usage**: Use for small tasks

#### size:m

- **Color**: #fbca04 (yellow)
- **Description**: Medium (3-5 days)
- **Usage**: Use for medium tasks

#### size:l

- **Color**: #ffa657 (orange)
- **Description**: Large (6-10 days)
- **Usage**: Use for large tasks

#### size:xl

- **Color**: #d73a4a (red)
- **Description**: Extra large (more than 10 days)
- **Usage**: Use for very large tasks

### Special Labels

#### good first issue

- **Color**: #7057ff (purple)
- **Description**: Good for newcomers
- **Usage**: Use for issues suitable for first-time contributors

#### help wanted

- **Color**: #008672 (teal)
- **Description**: Help is wanted
- **Usage**: Use when community help is needed

#### discussion

- **Color**: #fbca04 (yellow)
- **Description**: Discussion needed
- **Usage**: Use for issues requiring discussion

#### question

- **Color**: #d4c5f9 (light purple)
- **Description**: Question
- **Usage**: Use for questions

#### duplicate

- **Color**: #cfd3d7 (gray)
- **Description**: Duplicate issue
- **Usage**: Use for duplicate issues

#### invalid

- **Color**: #e11d21 (red)
- **Description**: Invalid issue
- **Usage**: Use for invalid issues

#### wontfix

- **Color**: #ffffff (white)
- **Description**: Won't fix
- **Usage**: Use for issues that won't be fixed

#### works-for-me

- **Color**: #cfd3d7 (gray)
- **Description**: Cannot reproduce
- **Usage**: Use when issue cannot be reproduced

## 🎯 Label Usage Guidelines

### Label Combinations

Recommended label combinations:

**Bug Report:**
- `type:bug` + `priority:critical/high/medium/low` + `component:*` + `status:*`

**Feature Request:**
- `type:feature` + `priority:high/medium/low` + `component:*` + `status:*`

**Pull Request:**
- `status:review` + `size:*` + `component:*`

**Good First Issue:**
- `good first issue` + `type:*` + `size:xs/s` + `component:*`

### Label Management

- Remove `status:needs-triage` after triage
- Add `status:in-progress` when work starts
- Remove `status:in-progress` when work stops
- Add `status:review` for PRs ready for review
- Remove all status labels when issue/PR is closed

### Label Cleanup

- Remove outdated labels
- Merge duplicate labels
- Update label descriptions as needed
- Review label usage quarterly

## 📊 Label Statistics

Track label usage to identify trends:

- Most common components
- Priority distribution
- Status distribution
- Size accuracy

## 🔄 Label Maintenance

### Review Schedule

- **Monthly**: Review label usage and patterns
- **Quarterly**: Full label review and cleanup
- **As Needed**: Add new labels or update existing

### Adding New Labels

1. Propose new label with justification
2. Discuss in team meeting
3. Get consensus
4. Add label to repository
5. Update this document
6. Communicate to team

## 📞 Contact

For questions about labels, contact:

- **Project Lead**: project-lead@stayos.dev
- **GitHub**: @islamelbaz2010

---

**Consistent label usage improves issue tracking and project management. Follow these guidelines for all issues and pull requests.**
