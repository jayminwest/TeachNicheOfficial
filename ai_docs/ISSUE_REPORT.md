# Issue Creation and Resolution Workflow

This document outlines the standardized process for creating and resolving detailed GitHub issues using AI assistance and the GitHub CLI.

> **Recent Example**: See [Pre-Launch Audit and Bug Fix Plan](./issues/2025-02-26-041-pre-launch-audit-and-bug-fix-plan.md) for a comprehensive audit template.

## Issue File Naming Convention

All issue files should follow this naming convention:
```
YYYY-MM-DD-ISSUE_NUMBER-issue-title-in-kebab-case.md
```

Example:
```
2025-02-26-037-transition-to-merchant-of-record-payment-model.md
```

This naming convention ensures:
- Chronological sorting by date
- Clear issue number reference
- Descriptive title for easy identification
- Consistent formatting with kebab-case

## Issue Creation Overview

The issue creation pipeline follows these steps:
1. User provides initial issue description
2. AI assistant expands and formats the issue
3. AI identifies affected files and system components
4. AI analyzes potential dependencies and side effects
5. Issue is created via GitHub CLI with comprehensive metadata

## Issue Resolution Overview

When fixing an issue, follow these steps:
1. Create a branch from dev specifically for the fix
2. Implement and test the fix across all affected components
3. Verify no regressions in dependent systems
4. Create a pull request with detailed implementation notes
5. Link the PR to the issue and all related issues

## Step 1: Initial Issue Description

Provide a clear, concise description of the issue including:
- What's not working (including all affected components)
- Steps to reproduce (with detailed sequence)
- Expected behavior (for each component)
- Environment details (OS, browser, device specifications, etc.)
- Related systems that might be affected
- Performance impact observations

Example:
```
Describe the bug: The dropdown menu component in the request dialog is not functioning properly 
on mobile devices. The menu either fails to open or doesn't respond to touch interactions.
Additionally, when the dropdown does open, it causes layout shifts and performance degradation
on the entire page. This affects both the request creation flow and the filtering system.

To Reproduce:
1. Go to '/requests' page
2. Open the request dialog
3. Attempt to interact with the dropdown menu on a mobile device
4. If successful in opening the menu, observe performance metrics
5. Try to select an option and observe if the selection is registered
6. Check if the selected value persists after dialog is closed and reopened

Expected behavior: 
- The dropdown menu should open smoothly on touch interaction
- No layout shifts should occur when opening/closing the menu
- Selection should be registered immediately
- Performance should remain stable (60fps, no jank)
- Selected values should persist across dialog sessions
- All dependent components should update accordingly

Environment:
- OS: iOS 16.5+ and Android 12+ (mobile devices)
- Browser: Mobile Safari, Chrome Mobile, Firefox Mobile
- Device specifications: Various screen sizes (iPhone 13/14, Samsung Galaxy S22/S23)
- Network conditions: Tested on both WiFi and 4G connections
- Related components: Request form, filter system, category selector
```

## Step 2: AI Issue Formatting

The AI assistant will:
1. Expand the issue description with comprehensive details
2. Add in-depth technical analysis including potential root causes
3. Format according to our template with enhanced sections
4. Identify potential architectural implications
5. Suggest testing strategies across multiple environments

The expanded issue will include:
- Detailed description with component relationships
- Comprehensive reproduction steps with edge cases
- Technical analysis with code flow diagrams
- Code examples from multiple affected components
- Environment details with version matrices
- Testing requirements across platforms and devices
- Performance impact assessment
- Accessibility implications
- Security considerations
- Additional context including historical similar issues
- User impact severity assessment

## Step 3: File Analysis

The AI assistant will identify:
1. Files that need to be updated (primary, secondary, and tertiary impacts)
2. Type of changes needed with code pattern recommendations
3. Testing requirements with specific test cases
4. Database schema impacts
5. API contract changes
6. State management implications
7. Performance optimization opportunities
8. Cross-browser compatibility considerations
9. Mobile-specific adaptations needed
10. Dependency version constraints

## Step 4: Creating the GitHub Issue

1. First, check available labels and consider multiple categorizations:
```bash
gh label list
```

2. Create the issue using GitHub CLI with comprehensive metadata:
```bash
gh issue create --title "Fix: [Issue Name]" --body-file issue-description.md --label "bug,high-priority,needs-reproduction" --assignee "@me" --project "Q2 Roadmap"
```

3. For complex issues, consider creating subtasks:
```bash
gh issue create --title "Subtask: [Component] specific fix" --body-file subtask1.md --label "bug,subtask" --assignee "@me" --linked-issues "#parent-issue-number"
```

Additional label options in our repository:
- bug (#d73a4a)
- documentation (#0075ca)
- enhancement (#a2eeef)
- good first issue (#7057ff)
- help wanted (#008672)
- question (#d876e3)
- high-priority (#ff0000)
- regression (#fbca04)
- security (#b60205)
- performance (#0e8a16)
- needs-reproduction (#c5def5)
- blocked (#b60205)
- cross-platform (#5319e7)

NAME              DESCRIPTION                                 COLOR  
bug               Something isn't working                     #d73a4a
documentation     Improvements or additions to documentation  #0075ca
duplicate         This issue or pull request already exists   #cfd3d7
enhancement       New feature or request                      #a2eeef
good first issue  Good for newcomers                          #7057ff
help wanted       Extra attention is needed                   #008672
invalid           This doesn't seem right                     #e4e669
question          Further information is requested            #d876e3
wontfix           This will not be worked on                  #ffffff
high-priority     Requires immediate attention                #ff0000
regression        Previously working functionality broken     #fbca04
security          Security vulnerability or concern           #b60205
performance       Performance-related issue                   #0e8a16
needs-reproduction Steps to reproduce needed                  #c5def5
blocked           Blocked by another issue                    #b60205
cross-platform    Affects multiple platforms                  #5319e7

## Best Practices

### Command Line Usage

1. **Single-Line Commands**
   - Always use single-line commands without line continuation characters (\)
   - Use quotes to handle spaces in arguments
   - This ensures compatibility with all shells and tools
   - For complex issues, consider creating a shell script with multiple commands

### For Issue Creation

1. **Issue Titles**
   - Start with type: "Fix:", "Feature:", "Docs:", "Perf:", "Refactor:", etc.
   - Be specific but concise
   - Include affected component and subsystem
   - For complex issues, consider a hierarchical naming convention

2. **Labels**
   - Always include at least one label
   - Use multiple labels to reflect complexity dimensions (performance, security, etc.)
   - Create new labels through GitHub UI if needed
   - Consider label combinations that reflect priority and complexity

3. **Assignments**
   - Use "@me" to self-assign
   - Only assign to others if pre-arranged
   - Consider using "help wanted" label instead
   - For complex issues, consider multiple assignees with clear responsibilities
   - Tag domain experts with @mentions in the description

4. **Issue Content**
   - Follow the template structure with expanded sections
   - Include all relevant technical details with architecture diagrams
   - Add screenshots, videos, and performance profiles if applicable
   - Link to related issues/PRs with explanation of relationships
   - Include browser console logs and network request details
   - Add code snippets from multiple affected files
   - Include environment variables that might affect the issue
   - Document attempted solutions and their outcomes

### For Issue Resolution

1. **Branch Naming**
   - Always create a branch from dev
   - Use the format: `fix/issue-NUMBER-brief-description`
   - For complex issues: `fix/issue-NUMBER-component-specific-fix`
   - Keep branch names concise but descriptive
   - Consider prefixing with area: `fix/ui/issue-NUMBER-component-fix`

2. **Commit Messages**
   - Reference the issue number with # prefix
   - Be clear about what the commit does
   - Use present tense (e.g., "Fix dropdown menu" not "Fixed dropdown menu")
   - For complex changes, use a structured format:
     ```
     Component: Fix specific issue
     
     - Detail about change 1
     - Detail about change 2
     
     Fixes #123
     Related to #456
     ```
   - Consider atomic commits for each logical change
   - Include performance impact notes when relevant

3. **Pull Requests**
   - Link to the issue in the PR description
   - Include "Resolves #ISSUE_NUMBER" to auto-close the issue when merged
   - For complex issues that address multiple issues: "Resolves #123, Fixes #456, Related to #789"
   - Request appropriate reviewers with domain expertise
   - Include before/after screenshots or videos
   - Document testing performed across environments
   - Include performance benchmarks if applicable
   - Add migration steps if needed
   - Document potential side effects

## Issue Creation Example

```bash
# 1. User describes complex issue to AI assistant
# 2. AI expands and formats issue in a temporary file with comprehensive analysis

# 3. Save the formatted issue to a file
ISSUE_TITLE="Mobile Select Menu Interaction Issues Affecting Multiple Components"
echo "# $ISSUE_TITLE" > issue-description.md
# Add the expanded issue content to the file

# 4. Check available labels for proper categorization
gh label list

# 5. Create issue with appropriate multiple labels
gh issue create --title "Fix: $ISSUE_TITLE" --body-file issue-description.md --label "bug,performance,cross-platform" --assignee "@me" --project "Q2 Roadmap"

# 6. For complex issues, create subtasks
PARENT_ISSUE=$(gh issue list --limit 1 --json number --jq '.[0].number')
echo "# Dropdown Component Specific Fixes" > subtask1.md
echo "This subtask addresses the core dropdown component issues from parent issue #$PARENT_ISSUE" >> subtask1.md
gh issue create --title "Subtask: Dropdown Component Fixes" --body-file subtask1.md --label "bug,subtask" --assignee "@me" --linked-issues "#$PARENT_ISSUE"

echo "# Layout Shift Resolution" > subtask2.md
echo "This subtask addresses the layout shift issues from parent issue #$PARENT_ISSUE" >> subtask2.md
gh issue create --title "Subtask: Fix Layout Shifts" --body-file subtask2.md --label "bug,subtask,performance" --assignee "@me" --linked-issues "#$PARENT_ISSUE"
```

## Issue Resolution Workflow

When you're ready to fix a complex issue:

```bash
# 1. Get the latest dev branch
git checkout dev
git pull

# 2. Create a fix branch from dev
# Use the issue number in the branch name when possible
ISSUE_NUMBER="123"  # Replace with actual issue number
git checkout -b fix/issue-$ISSUE_NUMBER-component-specific-fix dev

# 3. Implement the fix with comprehensive testing
# Consider creating a test plan document:
echo "# Test Plan for Issue #$ISSUE_NUMBER" > test-plan.md
echo "## Test Cases\n1. Mobile Safari iOS 16\n2. Chrome Android 12\n3. Firefox Mobile\n4. Various screen sizes\n5. Performance benchmarks" >> test-plan.md

# 4. Commit your changes with a detailed message that references the issue
git add .
git commit -m "Fix #$ISSUE_NUMBER: Resolve dropdown interaction issues

- Fix touch event handling on mobile devices
- Prevent layout shifts by using fixed positioning
- Optimize rendering performance
- Add comprehensive test coverage

Performance impact: 30% reduction in interaction delay
Fixes #$ISSUE_NUMBER
Related to #456"

# 5. Push your branch
git push -u origin fix/issue-$ISSUE_NUMBER-component-specific-fix

# 6. Create a detailed pull request that links to the issue
gh pr create --title "Fix #$ISSUE_NUMBER: Dropdown Menu Mobile Interactions" --body "## Changes
- Fixed touch event handling on mobile devices
- Prevented layout shifts with fixed positioning
- Added comprehensive test coverage
- Optimized rendering performance by 30%

## Testing
Tested on iOS 16, Android 12 with various screen sizes.
Performance benchmarks show 30% improvement.

Resolves #$ISSUE_NUMBER
Related to #456" --base dev

# 7. Request reviews from domain experts
gh pr edit --add-reviewer "ui-expert,mobile-expert"
```

This enhanced process ensures consistent, detailed issue reports for complex problems and properly tracked fixes that help developers understand and resolve intricate issues efficiently. The comprehensive approach accounts for cross-component dependencies, performance implications, and thorough testing across multiple environments.
