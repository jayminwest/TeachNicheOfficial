// We don't need render for these tests
import '@testing-library/react';
import * as UIComponents from '../index';

describe('UI Components exports', () => {
  it('exports Header component', () => {
    expect(UIComponents.Header).toBeDefined();
  });

  it('exports SignInPage component', () => {
    expect(UIComponents.SignInPage).toBeDefined();
  });

  it('exports AuthDialog component', () => {
    expect(UIComponents.AuthDialog).toBeDefined();
  });

  it('exports VisuallyHidden component', () => {
    expect(UIComponents.VisuallyHidden).toBeDefined();
  });

  it('exports Dialog components', () => {
    expect(UIComponents.Dialog).toBeDefined();
    expect(UIComponents.DialogContent).toBeDefined();
    expect(UIComponents.DialogTitle).toBeDefined();
    expect(UIComponents.DialogDescription).toBeDefined();
  });

  // This test ensures we're exporting the correct number of components
  // and will fail if components are added or removed without updating tests
  it('exports the expected number of components', () => {
    // Count individual exports (Header, SignInPage, AuthDialog, VisuallyHidden)
    // Plus Dialog components (Dialog, DialogContent, DialogTitle, DialogDescription)
    const expectedExportCount = 8;
    const actualExportCount = Object.keys(UIComponents).length;
    
    expect(actualExportCount).toBe(expectedExportCount);
  });
});
