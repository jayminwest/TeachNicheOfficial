# Fix: Lesson Card Formatting and Price Display Issues

## Issue Description

The lesson cards throughout the application are displaying formatting issues, particularly with price displays. This affects multiple views including the homepage, lesson listings, and search results.

### Symptoms
- Price formatting is inconsistent or incorrect
- Card layouts appear broken on certain screen sizes
- Text may be truncated or overflowing
- Currency symbols may be missing or incorrectly positioned
- Spacing and alignment issues between card elements

## Steps to Reproduce
1. Navigate to the homepage
2. Observe lesson cards in the featured section
3. Navigate to /lessons page
4. Check lesson cards in different viewport sizes (mobile, tablet, desktop)
5. Compare price displays across different lesson cards

## Expected Behavior
- Prices should be consistently formatted using the `formatPrice()` utility
- Cards should maintain proper layout across all screen sizes
- Text should be properly truncated with ellipsis when necessary
- Currency symbols should be correctly positioned
- Spacing between card elements should be consistent

## Technical Analysis

### Affected Components
- `app/components/ui/lesson-card.tsx` (primary)
- Any components that render lesson prices
- Grid layouts containing lesson cards

### Potential Root Causes
1. Missing or inconsistent use of the `formatPrice()` utility function
2. Responsive design breakpoints not properly implemented
3. CSS flexbox or grid issues in the card layout
4. Inconsistent data formatting from API responses
5. Missing overflow handling for text elements

### Impact Assessment
- **Severity**: Medium
- **Scope**: Multiple pages and components
- **User Impact**: Affects readability and user experience
- **Business Impact**: May reduce conversion rate due to unclear pricing

## Files Likely Needing Changes
- `app/components/ui/lesson-card.tsx` (primary)
- `app/lib/constants.ts` (verify formatPrice implementation)
- CSS modules or Tailwind classes related to card layouts
- Any components that directly render lesson prices

## Testing Requirements
- Verify correct price formatting across different price points (free, low-cost, high-cost)
- Test responsive behavior across standard breakpoints (320px, 768px, 1024px, 1440px)
- Verify correct handling of long titles and descriptions
- Test with different currencies if applicable
- Verify accessibility of price information

## Additional Context
This issue affects the core product display components and should be addressed promptly as it impacts the user's ability to quickly understand pricing information, which is critical for conversion.

## Related Issues
- May be related to any recent UI component library updates
- Could be connected to any recent changes in price calculation logic
