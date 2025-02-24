# Mobile Select Menu Interaction Issues

## Description
The Select menu component in the request dialog is not functioning properly on mobile devices. The menu either fails to open or doesn't respond to touch interactions correctly. This appears to be due to positioning and touch event handling issues within the scrollable dialog content.

## To Reproduce
1. Navigate to '/requests' page
2. Click "New Request" button to open the request dialog
3. Try to interact with the Category select dropdown on a mobile device
4. Observe that the dropdown menu is either:
   - Unresponsive to touch
   - Opens but gets cut off
   - Doesn't position correctly relative to the trigger
   - May be obscured by other dialog content

## Expected Behavior
- Select dropdown should open smoothly on touch interaction
- Menu should position correctly relative to its trigger
- Menu should be fully visible and not cut off
- Touch interactions should work consistently
- Behavior should match desktop experience

## Technical Analysis

### Affected Components
1. `app/requests/components/request-dialog.tsx`
   - Contains the dialog implementation with the problematic select
   - Current implementation has scrollable content that may interfere with select positioning

2. `app/components/ui/select.tsx`
   - Core select component implementation
   - Uses Radix UI primitives
   - May need improved touch handling and positioning logic

3. `app/components/ui/dialog.tsx`
   - Dialog component that contains the select
   - Current max-height and overflow settings may affect select menu positioning

### Root Cause
The issue stems from:
1. Conflict between dialog's scrollable content and select menu positioning
2. Potential z-index stacking context issues
3. Possible touch event handling limitations

### Code Issues
```typescript
// In request-dialog.tsx
<DialogContent className="max-w-[95vw] w-full sm:max-w-md max-h-[90vh] overflow-hidden">
  <div className="flex-1 overflow-y-auto pt-2 pb-4 px-1">
    // Select component inside scrollable container
  </div>
</DialogContent>

// In select.tsx
<SelectPrimitive.Content
  position="popper"
  // Current positioning may not account for scrollable container
>
```

## Environment
- **OS**: iOS and Android (mobile devices)
- **Browser**: Mobile Safari, Chrome Mobile
- **Version**: Latest versions
- **Screen sizes**: Various mobile viewport sizes

## Files Needing Updates

1. `app/requests/components/request-dialog.tsx`
   - Adjust dialog content structure
   - Improve select component positioning
   - Update overflow handling

2. `app/components/ui/select.tsx`
   - Enhance mobile touch handling
   - Improve positioning logic
   - Update z-index management

3. `app/components/ui/dialog.tsx`
   - Review and potentially update stacking context
   - Adjust overflow handling

4. `app/__tests__/utils/test-utils.tsx`
   - Add mobile-specific test cases
   - Include touch interaction testing

## Testing Requirements
- Add specific mobile device viewport tests
- Test touch interactions
- Verify positioning across different screen sizes
- Ensure scrolling behavior works correctly
- Validate z-index stacking

## Additional Context
- Issue appears to be specific to mobile devices
- Desktop functionality works as expected
- Problem is more pronounced on smaller viewport sizes
- May need to consider different positioning strategy for mobile vs desktop
