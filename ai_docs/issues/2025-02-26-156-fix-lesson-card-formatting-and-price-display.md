# Lesson Card Formatting and Price Display Fix

**Issue ID:** 2025-02-26-042  
**Priority:** High  
**Affected Component:** Frontend/Lesson Cards  
**Reported By:** UI Review Team  
**Assigned To:** Frontend Team  

## Problem Description
Users are experiencing inconsistent lesson card formatting across devices and incorrect price display that doesn't account for Stripe processing fees. Key issues:

1. Card layout breaks on mobile devices (<768px)
2. Price displays only base amount without required processing fees
3. Instructor payout calculation (85%) not shown in preview mode
4. Missing currency formatting for non-USD users

## Acceptance Criteria
- [ ] Responsive layout for all viewports (320px+)
- [ ] Price displays as "Base price + fee" with total
- [ ] Instructor preview shows payout calculation
- [ ] Localized currency formatting
- [ ] Mobile touch targets >= 48px
- [ ] Cross-browser testing (Chrome, Safari, Firefox)
- [ ] Playwright tests for price display logic

## Technical Notes
1. Use Shadcn UI Card component as base
2. Integrate with Stripe fee calculator utility
3. Follow currency formatting from `src/lib/i18n`
4. Update TypeScript interfaces for price display
5. Add responsive design unit tests

## Related Documentation
- [Payment Processing Standards](../core/ARCHITECTURE.md#data-flow)
- [UI Accessibility Guidelines](../standards/ACCESSIBILITY.md)
- [Currency Formatting Utilities](../reference/frontend/CURRENCY_FORMATTING.md)

## Testing Plan
1. Write Playwright tests that:
   - Verify price breakdown visibility
   - Check responsive layout assertions
   - Validate currency localization
   - Confirm Stripe fee calculations
2. Update component unit tests
3. Manual QA checklist for cross-browser testing

## Version History
| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2025-02-26 | UI Team | Initial issue documentation |

---

*This issue follows the documentation standards outlined in [DOCUMENTATION_USAGE.md](../core/DOCUMENTATION_USAGE.md). All work must adhere to the project's test-driven development approach with complete test coverage.*
