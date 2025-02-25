# Issue Creation and Resolution Workflow

This document outlines the standardized process for creating and resolving detailed GitHub issues using AI assistance and the GitHub CLI.

## Issue Creation Overview

The issue creation pipeline follows these steps:
1. User provides initial issue description
2. AI assistant expands and formats the issue
3. AI identifies affected files
4. Issue is created via GitHub CLI

## Issue Resolution Overview

When fixing an issue, follow these steps:
1. Create a branch from dev specifically for the fix
2. Implement and test the fix
3. Create a pull request
4. Link the PR to the issue

## Step 1: Initial Issue Description

Provide a clear, concise description of the issue including:
- What's not working
- Steps to reproduce
- Expected behavior
- Environment details (OS, browser, etc.)

Example:
```
Describe the bug: The dropdown menu component in the request dialog is not functioning properly 
on mobile devices. The menu either fails to open or doesn't respond to touch interactions.

To Reproduce:
1. Go to '/requests' page
2. Open the request dialog
3. Attempt to interact with the dropdown menu on a mobile device

Expected behavior: The dropdown menu should open smoothly on touch interaction and allow selection
of options, matching the behavior seen on desktop devices.

Environment:
- OS: iOS and Android (mobile devices)
- Browser: Mobile Safari, Chrome Mobile
```

## Step 2: AI Issue Formatting

The AI assistant will:
1. Expand the issue description
2. Add technical analysis
3. Format according to our template
4. Save to `ai_docs/scratchpad.md` and also to the `ai_docs/issues/` directory

The expanded issue will include:
- Detailed description
- Reproduction steps
- Technical analysis
- Code examples
- Environment details
- Testing requirements
- Additional context

When saving to the ai_docs/issues/ directory, use a descriptive filename with the date and issue title:
```bash
# Example filename format
YYYY-MM-DD-issue-title-slug.md
```

## Step 3: File Analysis

The AI assistant will identify:
1. Files that need to be updated
2. Type of changes needed
3. Testing requirements

This analysis is added to the issue report in `scratchpad.md`.

## Step 4: Creating the GitHub Issue

1. First, check available labels:
```bash
gh label list
```

2. Save the issue to the ai_docs/issues/ directory:
```bash
# Create issues directory if it doesn't exist
mkdir -p issues

# Save with descriptive filename including date and issue title
ISSUE_FILE="issues/$(date +%Y-%m-%d)-$(echo "$ISSUE_TITLE" | tr '[:upper:]' '[:lower:]' | tr ' ' '-').md"
cp ai_docs/scratchpad.md "$ISSUE_FILE"
```

3. Create the issue using GitHub CLI:
```bash
gh issue create --title "Fix: [Issue Name]" --body "$(cat ai_docs/scratchpad.md)" --label "bug" --assignee "@me"
```

Additional label options in our repository:
- bug (#d73a4a)
- documentation (#0075ca)
- enhancement (#a2eeef)
- good first issue (#7057ff)
- help wanted (#008672)
- question (#d876e3)

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

## Best Practices

### For Issue Creation

1. **Issue Titles**
   - Start with type: "Fix:", "Feature:", "Docs:", etc.
   - Be specific but concise
   - Include affected component

2. **Labels**
   - Always include at least one label
   - Use multiple labels when appropriate
   - Create new labels through GitHub UI if needed

3. **Assignments**
   - Use "@me" to self-assign
   - Only assign to others if pre-arranged
   - Consider using "help wanted" label instead

4. **Issue Content**
   - Follow the template structure
   - Include all relevant technical details
   - Add screenshots if applicable
   - Link to related issues/PRs

### For Issue Resolution

1. **Branch Naming**
   - Always create a branch from dev
   - Use the format: `fix/issue-NUMBER-brief-description`
   - Keep branch names concise but descriptive

2. **Commit Messages**
   - Reference the issue number with # prefix
   - Be clear about what the commit does
   - Use present tense (e.g., "Fix dropdown menu" not "Fixed dropdown menu")

3. **Pull Requests**
   - Link to the issue in the PR description
   - Include "Resolves #ISSUE_NUMBER" to auto-close the issue when merged
   - Request appropriate reviewers

## Issue Creation Example

```bash
# 1. User describes issue to AI assistant
# 2. AI expands and formats issue in scratchpad.md

# 3. Save to issues directory with descriptive filename
ISSUE_TITLE="Mobile Select Menu Interaction Issues"
ISSUE_FILE="ai_docs/issues/$(date +%Y-%m-%d)-$(echo "$ISSUE_TITLE" | tr '[:upper:]' '[:lower:]' | tr ' ' '-').md"
mkdir -p ai_docs/issues
cp ai_docs/scratchpad.md "$ISSUE_FILE"

# 4. Check available labels
gh label list

# 5. Create issue with appropriate labels
gh issue create --title "Fix: $ISSUE_TITLE" \
  --body "$(cat ai_docs/scratchpad.md)" \
  --label "bug" \
  --assignee "@me"
```

## Issue Resolution Workflow

When you're ready to fix an issue:

```bash
# 1. Get the latest dev branch
git checkout dev
git pull

# 2. Create a fix branch from dev
# Use the issue number in the branch name when possible
ISSUE_NUMBER="123"  # Replace with actual issue number
git checkout -b fix/issue-$ISSUE_NUMBER-brief-description dev

# 3. Implement the fix

# 4. Commit your changes with a descriptive message that references the issue
git add .
git commit -m "Fix #$ISSUE_NUMBER: Brief description of the fix"

# 5. Push your branch
git push -u origin fix/issue-$ISSUE_NUMBER-brief-description

# 6. Create a pull request that links to the issue
gh pr create --title "Fix #$ISSUE_NUMBER: Brief description" \
  --body "Resolves #$ISSUE_NUMBER" \
  --base dev
```

This standardized process ensures consistent, detailed issue reports and properly tracked fixes that help developers understand and resolve problems efficiently.
