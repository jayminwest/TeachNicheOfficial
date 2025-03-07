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

describe('Toast Components', () => {
  describe('Toast', () => {
    it('renders with default variant', () => {
      render(<Toast>Test Toast</Toast>);
      const toast = screen.getByText('Test Toast');
      expect(toast).toBeInTheDocument();
      expect(toast).toHaveClass('border', 'bg-background');
    });

    it('renders with destructive variant', () => {
      render(<Toast variant="destructive">Destructive Toast</Toast>);
      const toast = screen.getByText('Destructive Toast');
      expect(toast).toBeInTheDocument();
      expect(toast).toHaveClass('destructive', 'border-destructive');
    });

    it('applies custom className', () => {
      render(<Toast className="custom-class">Custom Toast</Toast>);
      const toast = screen.getByText('Custom Toast');
      expect(toast).toBeInTheDocument();
      expect(toast).toHaveClass('custom-class');
    });
  });

  describe('ToastTitle', () => {
    it('renders with default styling', () => {
      render(<ToastTitle>Toast Title</ToastTitle>);
      const title = screen.getByText('Toast Title');
      expect(title).toBeInTheDocument();
      expect(title).toHaveClass('text-sm', 'font-semibold');
    });

    it('applies custom className', () => {
      render(<ToastTitle className="custom-title">Custom Title</ToastTitle>);
      const title = screen.getByText('Custom Title');
      expect(title).toBeInTheDocument();
      expect(title).toHaveClass('custom-title');
    });
  });

  describe('ToastDescription', () => {
    it('renders with default styling', () => {
      render(<ToastDescription>Toast Description</ToastDescription>);
      const description = screen.getByText('Toast Description');
      expect(description).toBeInTheDocument();
      expect(description).toHaveClass('text-sm', 'opacity-90');
    });

    it('applies custom className', () => {
      render(<ToastDescription className="custom-desc">Custom Description</ToastDescription>);
      const description = screen.getByText('Custom Description');
      expect(description).toBeInTheDocument();
      expect(description).toHaveClass('custom-desc');
    });
  });

  describe('ToastAction', () => {
    it('renders with default styling', () => {
      render(<ToastAction>Action</ToastAction>);
      const action = screen.getByText('Action');
      expect(action).toBeInTheDocument();
      expect(action).toHaveClass('inline-flex', 'rounded-md');
    });

    it('applies custom className', () => {
      render(<ToastAction className="custom-action">Custom Action</ToastAction>);
      const action = screen.getByText('Custom Action');
      expect(action).toBeInTheDocument();
      expect(action).toHaveClass('custom-action');
    });
  });

  describe('ToastClose', () => {
    it('renders with default styling', async () => {
      const user = userEvent.setup();
      const onClickMock = jest.fn();
      
      render(<ToastClose onClick={onClickMock} />);
      const closeButton = screen.getByRole('button');
      
      expect(closeButton).toBeInTheDocument();
      expect(closeButton).toHaveAttribute('toast-close', '');
      
      await user.click(closeButton);
      expect(onClickMock).toHaveBeenCalledTimes(1);
    });

    it('applies custom className', () => {
      render(<ToastClose className="custom-close" />);
      const closeButton = screen.getByRole('button');
      expect(closeButton).toBeInTheDocument();
      expect(closeButton).toHaveClass('custom-close');
    });
  });

  describe('ToastViewport', () => {
    it('renders with default styling', () => {
      render(<ToastViewport />);
      const viewport = screen.getByRole('region');
      expect(viewport).toBeInTheDocument();
      expect(viewport).toHaveClass('fixed', 'top-0', 'z-[100]');
    });

    it('applies custom className', () => {
      render(<ToastViewport className="custom-viewport" />);
      const viewport = screen.getByRole('region');
      expect(viewport).toBeInTheDocument();
      expect(viewport).toHaveClass('custom-viewport');
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
        <ToastProvider>
          <Toast>
            <ToastTitle>Notification</ToastTitle>
            <ToastDescription>This is a toast notification</ToastDescription>
            <ToastClose />
            <ToastAction>Undo</ToastAction>
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
