# Issue Creation Workflow

This document outlines the standardized process for creating detailed GitHub issues using AI assistance and the GitHub CLI.

## Overview

The issue creation pipeline follows these steps:
1. User provides initial issue description
2. AI assistant expands and formats the issue
3. AI identifies affected files
4. Issue is created via GitHub CLI

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
4. Save to `ai_docs/scratchpad.md`

The expanded issue will include:
- Detailed description
- Reproduction steps
- Technical analysis
- Code examples
- Environment details
- Testing requirements
- Additional context

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

2. Create the issue using GitHub CLI:
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

## Best Practices

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

## Example Workflow

```bash
# 1. User describes issue to AI assistant
# 2. AI expands and formats issue in scratchpad.md
# 3. Check available labels
gh label list

# 4. Create issue with appropriate labels
gh issue create --title "Fix: Mobile Select Menu Interaction Issues" \
  --body "$(cat ai_docs/scratchpad.md)" \
  --label "bug" \
  --assignee "@me"
```

This standardized process ensures consistent, detailed issue reports that help developers understand and resolve problems efficiently.
