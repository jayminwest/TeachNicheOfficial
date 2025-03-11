import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth';
import { setupApiInterceptors } from '../helpers/api-interceptor';

test.describe('Profile Edit', () => {
  test.beforeEach(async ({ page }) => {
    // Set up API interceptors
    await setupApiInterceptors(page);
    
    // Log in as a learner
    await login(page, 'learner');
    
    // Go to profile page
    await page.goto('/profile');
    
    // Click edit profile button
    await page.getByRole('button', { name: /edit profile/i }).click();
  });
  
  test('displays edit form with current profile data', async ({ page }) => {
    // Verify form is visible with current data
    const nameInput = page.getByLabel(/name/i);
    await expect(nameInput).toBeVisible();
    await expect(nameInput).toHaveValue('Test Learner');
    
    const bioInput = page.getByLabel(/bio/i);
    await expect(bioInput).toBeVisible();
    
    // Verify save button is present
    await expect(page.getByRole('button', { name: /save/i })).toBeVisible();
  });
  
  test('validates required fields', async ({ page }) => {
    // Clear required field
    await page.getByLabel(/name/i).fill('');
    
    // Try to save
    await page.getByRole('button', { name: /save/i }).click();
    
    // Verify validation error
    await expect(page.getByText(/name is required/i)).toBeVisible();
    
    // Verify form wasn't submitted
    await expect(page.getByLabel(/name/i)).toBeVisible();
  });
  
  test('successfully updates profile information', async ({ page }) => {
    // Update profile information
    await page.getByLabel(/name/i).fill('Updated Name');
    await page.getByLabel(/bio/i).fill('This is my updated bio for testing purposes.');
    
    // Save changes
    await page.getByRole('button', { name: /save/i }).click();
    
    // Verify success message
    await expect(page.getByText(/profile updated successfully/i)).toBeVisible();
    
    // Verify profile page shows updated information
    await expect(page.getByText('Updated Name')).toBeVisible();
    await expect(page.getByText('This is my updated bio for testing purposes.')).toBeVisible();
  });
  
  test('handles API errors during update', async ({ page }) => {
    // Configure API interceptor to simulate error
    await page.evaluate(() => {
      localStorage.setItem('mock-api-error', JSON.stringify({
        route: 'updateProfile',
        error: 'Server error occurred while updating profile'
      }));
    });
    
    // Update profile information
    await page.getByLabel(/name/i).fill('Error Test');
    
    // Try to save
    await page.getByRole('button', { name: /save/i }).click();
    
    // Verify error message
    await expect(page.getByText(/error updating profile/i)).toBeVisible();
    
    // Clear mock error for cleanup
    await page.evaluate(() => {
      localStorage.removeItem('mock-api-error');
    });
  });
  
  test('allows canceling edit without saving changes', async ({ page }) => {
    // Make changes to the form
    await page.getByLabel(/name/i).fill('Unsaved Changes');
    
    // Click cancel button
    await page.getByRole('button', { name: /cancel/i }).click();
    
    // Verify we're back on profile view
    await expect(page.getByText('Test Learner')).toBeVisible();
    
    // Verify changes were not saved
    await expect(page.getByText('Unsaved Changes')).not.toBeVisible();
  });
});
