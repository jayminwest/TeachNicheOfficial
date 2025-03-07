import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastTitle,
  ToastProvider,
  ToastViewport,
} from '@/app/components/ui/toast';

// Create a wrapper component to provide ToastProvider context
const ToastWrapper = ({ children }: { children: React.ReactNode }) => (
  <ToastProvider>
    {children}
    <ToastViewport />
  </ToastProvider>
);

describe('Toast Components', () => {
  describe('Toast', () => {
    it('renders with default variant', () => {
      render(
        <ToastWrapper>
          <Toast>Test Toast</Toast>
        </ToastWrapper>
      );
      const toast = screen.getByText('Test Toast');
      expect(toast).toBeInTheDocument();
      expect(toast.className).toContain('border');
      expect(toast.className).toContain('bg-background');
    });

    it('renders with destructive variant', () => {
      render(
        <ToastWrapper>
          <Toast variant="destructive">Destructive Toast</Toast>
        </ToastWrapper>
      );
      const toast = screen.getByText('Destructive Toast');
      expect(toast).toBeInTheDocument();
      expect(toast.className).toContain('destructive');
      expect(toast.className).toContain('border-destructive');
    });

    it('applies custom className', () => {
      render(
        <ToastWrapper>
          <Toast className="custom-class">Custom Toast</Toast>
        </ToastWrapper>
      );
      const toast = screen.getByText('Custom Toast');
      expect(toast).toBeInTheDocument();
      expect(toast.className).toContain('custom-class');
    });
  });

  describe('ToastTitle', () => {
    it('renders with default styling', () => {
      render(
        <ToastWrapper>
          <Toast>
            <ToastTitle>Toast Title</ToastTitle>
          </Toast>
        </ToastWrapper>
      );
      const title = screen.getByText('Toast Title');
      expect(title).toBeInTheDocument();
      expect(title.className).toContain('text-sm');
      expect(title.className).toContain('font-semibold');
    });

    it('applies custom className', () => {
      render(
        <ToastWrapper>
          <Toast>
            <ToastTitle className="custom-title">Custom Title</ToastTitle>
          </Toast>
        </ToastWrapper>
      );
      const title = screen.getByText('Custom Title');
      expect(title).toBeInTheDocument();
      expect(title.className).toContain('custom-title');
    });
  });

  describe('ToastDescription', () => {
    it('renders with default styling', () => {
      render(
        <ToastWrapper>
          <Toast>
            <ToastDescription>Toast Description</ToastDescription>
          </Toast>
        </ToastWrapper>
      );
      const description = screen.getByText('Toast Description');
      expect(description).toBeInTheDocument();
      expect(description.className).toContain('text-sm');
      expect(description.className).toContain('opacity-90');
    });

    it('applies custom className', () => {
      render(
        <ToastWrapper>
          <Toast>
            <ToastDescription className="custom-desc">Custom Description</ToastDescription>
          </Toast>
        </ToastWrapper>
      );
      const description = screen.getByText('Custom Description');
      expect(description).toBeInTheDocument();
      expect(description.className).toContain('custom-desc');
    });
  });

  describe('ToastAction', () => {
    it('renders with default styling', () => {
      render(
        <ToastWrapper>
          <Toast>
            <ToastAction>Action</ToastAction>
          </Toast>
        </ToastWrapper>
      );
      const action = screen.getByText('Action');
      expect(action).toBeInTheDocument();
      expect(action.className).toContain('inline-flex');
      expect(action.className).toContain('rounded-md');
    });

    it('applies custom className', () => {
      render(
        <ToastWrapper>
          <Toast>
            <ToastAction className="custom-action">Custom Action</ToastAction>
          </Toast>
        </ToastWrapper>
      );
      const action = screen.getByText('Custom Action');
      expect(action).toBeInTheDocument();
      expect(action.className).toContain('custom-action');
    });
  });

  describe('ToastClose', () => {
    it('renders with default styling', async () => {
      const user = userEvent.setup();
      const onClickMock = jest.fn();
      
      render(
        <ToastWrapper>
          <Toast>
            <ToastClose onClick={onClickMock} />
          </Toast>
        </ToastWrapper>
      );
      const closeButton = screen.getByRole('button');
      
      expect(closeButton).toBeInTheDocument();
      expect(closeButton).toHaveAttribute('toast-close', '');
      
      await user.click(closeButton);
      expect(onClickMock).toHaveBeenCalledTimes(1);
    });

    it('applies custom className', () => {
      render(
        <ToastWrapper>
          <Toast>
            <ToastClose className="custom-close" />
          </Toast>
        </ToastWrapper>
      );
      const closeButton = screen.getByRole('button');
      expect(closeButton).toBeInTheDocument();
      expect(closeButton.className).toContain('custom-close');
    });
  });

  describe('ToastViewport', () => {
    it('renders with default styling', () => {
      render(
        <ToastProvider>
          <ToastViewport />
        </ToastProvider>
      );
      const viewport = screen.getByRole('region');
      expect(viewport).toBeInTheDocument();
      expect(viewport.className).toContain('fixed');
      expect(viewport.className).toContain('top-0');
      expect(viewport.className).toContain('z-[100]');
    });

    it('applies custom className', () => {
      render(
        <ToastProvider>
          <ToastViewport className="custom-viewport" />
        </ToastProvider>
      );
      const viewport = screen.getByRole('region');
      expect(viewport).toBeInTheDocument();
      expect(viewport.className).toContain('custom-viewport');
    });
  });

  describe('ToastProvider', () => {
    it('renders children', () => {
      render(
        <ToastProvider>
          <div data-testid="toast-child">Toast Provider Child</div>
        </ToastProvider>
      );
      const child = screen.getByTestId('toast-child');
      expect(child).toBeInTheDocument();
      expect(child).toHaveTextContent('Toast Provider Child');
    });
  });

  describe('Toast Integration', () => {
    it('renders a complete toast with all components', () => {
      render(
        <ToastProvider swipeDirection="right">
          <Toast>
            <ToastTitle>Notification</ToastTitle>
            <ToastDescription>This is a toast notification</ToastDescription>
            <ToastClose />
            <ToastAction altText="Undo action">Undo</ToastAction>
          </Toast>
          <ToastViewport />
        </ToastProvider>
      );

      expect(screen.getByText('Notification')).toBeInTheDocument();
      expect(screen.getByText('This is a toast notification')).toBeInTheDocument();
      expect(screen.getByText('Undo')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '' })).toBeInTheDocument(); // Close button
    });
  });
});
