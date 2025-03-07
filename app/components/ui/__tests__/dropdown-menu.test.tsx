import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup
} from '../dropdown-menu';
import { Check, ChevronRight, Circle } from 'lucide-react';

// Mock the Radix UI components
jest.mock('@radix-ui/react-dropdown-menu', () => {
  const Original = jest.requireActual('@radix-ui/react-dropdown-menu');
  return {
    ...Original,
    Root: ({ children }: { children: React.ReactNode }) => <div data-testid="dropdown-root">{children}</div>,
    Trigger: ({ children, ...props }: { children: React.ReactNode }) => (
      <button data-testid="dropdown-trigger" {...props}>
        {children}
      </button>
    ),
    Portal: ({ children }: { children: React.ReactNode }) => <div data-testid="dropdown-portal">{children}</div>,
    Content: React.forwardRef(({ children, ...props }: { children: React.ReactNode }, ref) => (
      <div data-testid="dropdown-content" {...props} ref={ref}>
        {children}
      </div>
    )),
    Item: React.forwardRef(({ children, ...props }: { children: React.ReactNode }, ref) => (
      <div data-testid="dropdown-item" {...props} ref={ref}>
        {children}
      </div>
    )),
    CheckboxItem: React.forwardRef(({ children, checked, ...props }: { children: React.ReactNode, checked?: boolean }, ref) => (
      <div data-testid="dropdown-checkbox-item" data-checked={checked} {...props} ref={ref}>
        {children}
      </div>
    )),
    RadioItem: React.forwardRef(({ children, ...props }: { children: React.ReactNode }, ref) => (
      <div data-testid="dropdown-radio-item" {...props} ref={ref}>
        {children}
      </div>
    )),
    Label: React.forwardRef(({ children, ...props }: { children: React.ReactNode }, ref) => (
      <div data-testid="dropdown-label" {...props} ref={ref}>
        {children}
      </div>
    )),
    Separator: React.forwardRef(({ ...props }, ref) => (
      <hr data-testid="dropdown-separator" {...props} ref={ref} />
    )),
    Group: ({ children, ...props }: { children: React.ReactNode }) => (
      <div data-testid="dropdown-group" {...props}>
        {children}
      </div>
    ),
    Sub: ({ children, ...props }: { children: React.ReactNode }) => (
      <div data-testid="dropdown-sub" {...props}>
        {children}
      </div>
    ),
    SubContent: React.forwardRef(({ children, ...props }: { children: React.ReactNode }, ref) => (
      <div data-testid="dropdown-sub-content" {...props} ref={ref}>
        {children}
      </div>
    )),
    SubTrigger: React.forwardRef(({ children, ...props }: { children: React.ReactNode }, ref) => (
      <div data-testid="dropdown-sub-trigger" {...props} ref={ref}>
        {children}
      </div>
    )),
    RadioGroup: ({ children, ...props }: { children: React.ReactNode }) => (
      <div data-testid="dropdown-radio-group" {...props}>
        {children}
      </div>
    ),
    ItemIndicator: ({ children }: { children: React.ReactNode }) => (
      <span data-testid="dropdown-item-indicator">{children}</span>
    ),
  };
});

// Mock the lucide-react icons
jest.mock('lucide-react', () => ({
  Check: (props: any) => <div data-testid="check-icon" {...props} />,
  ChevronRight: (props: any) => <div data-testid="chevron-right-icon" {...props} />,
  Circle: (props: any) => <div data-testid="circle-icon" {...props} />,
}));

describe('DropdownMenu Components', () => {
  describe('DropdownMenu', () => {
    it('renders children correctly', () => {
      render(
        <DropdownMenu>
          <div data-testid="dropdown-child">Child content</div>
        </DropdownMenu>
      );
      
      expect(screen.getByTestId('dropdown-root')).toBeInTheDocument();
      expect(screen.getByTestId('dropdown-child')).toBeInTheDocument();
    });
  });

  describe('DropdownMenuTrigger', () => {
    it('renders children correctly', () => {
      render(
        <DropdownMenuTrigger>
          <span>Trigger Text</span>
        </DropdownMenuTrigger>
      );
      
      const trigger = screen.getByTestId('dropdown-trigger');
      expect(trigger).toBeInTheDocument();
      expect(trigger).toHaveTextContent('Trigger Text');
    });
  });

  describe('DropdownMenuContent', () => {
    it('renders with default props', () => {
      render(<DropdownMenuContent>Content</DropdownMenuContent>);
      
      const content = screen.getByTestId('dropdown-content');
      expect(content).toBeInTheDocument();
      expect(content).toHaveTextContent('Content');
      expect(content).toHaveAttribute('sideOffset', '4');
    });

    it('renders with custom className', () => {
      render(<DropdownMenuContent className="custom-class">Content</DropdownMenuContent>);
      
      const content = screen.getByTestId('dropdown-content');
      expect(content).toHaveClass('custom-class');
    });

    it('renders with custom sideOffset', () => {
      render(<DropdownMenuContent sideOffset={10}>Content</DropdownMenuContent>);
      
      const content = screen.getByTestId('dropdown-content');
      expect(content).toHaveAttribute('sideOffset', '10');
    });
  });

  describe('DropdownMenuItem', () => {
    it('renders with default props', () => {
      render(<DropdownMenuItem>Menu Item</DropdownMenuItem>);
      
      const item = screen.getByTestId('dropdown-item');
      expect(item).toBeInTheDocument();
      expect(item).toHaveTextContent('Menu Item');
    });

    it('renders with inset prop', () => {
      render(<DropdownMenuItem inset>Inset Menu Item</DropdownMenuItem>);
      
      const item = screen.getByTestId('dropdown-item');
      expect(item).toHaveClass('pl-8');
    });

    it('renders with custom className', () => {
      render(<DropdownMenuItem className="custom-item">Custom Item</DropdownMenuItem>);
      
      const item = screen.getByTestId('dropdown-item');
      expect(item).toHaveClass('custom-item');
    });
  });

  describe('DropdownMenuCheckboxItem', () => {
    it('renders unchecked by default', () => {
      render(<DropdownMenuCheckboxItem>Checkbox Item</DropdownMenuCheckboxItem>);
      
      const item = screen.getByTestId('dropdown-checkbox-item');
      expect(item).toBeInTheDocument();
      expect(item).toHaveTextContent('Checkbox Item');
      expect(item).not.toHaveAttribute('data-checked', 'true');
    });

    it('renders checked when specified', () => {
      render(<DropdownMenuCheckboxItem checked>Checked Item</DropdownMenuCheckboxItem>);
      
      const item = screen.getByTestId('dropdown-checkbox-item');
      expect(item).toHaveAttribute('data-checked', 'true');
    });

    it('renders with custom className', () => {
      render(<DropdownMenuCheckboxItem className="custom-checkbox">Custom Checkbox</DropdownMenuCheckboxItem>);
      
      const item = screen.getByTestId('dropdown-checkbox-item');
      expect(item).toHaveClass('custom-checkbox');
    });
  });

  describe('DropdownMenuRadioItem', () => {
    it('renders correctly', () => {
      render(<DropdownMenuRadioItem value="option1">Radio Item</DropdownMenuRadioItem>);
      
      const item = screen.getByTestId('dropdown-radio-item');
      expect(item).toBeInTheDocument();
      expect(item).toHaveTextContent('Radio Item');
    });

    it('renders with custom className', () => {
      render(<DropdownMenuRadioItem className="custom-radio" value="option1">Custom Radio</DropdownMenuRadioItem>);
      
      const item = screen.getByTestId('dropdown-radio-item');
      expect(item).toHaveClass('custom-radio');
    });
  });

  describe('DropdownMenuLabel', () => {
    it('renders correctly', () => {
      render(<DropdownMenuLabel>Label Text</DropdownMenuLabel>);
      
      const label = screen.getByTestId('dropdown-label');
      expect(label).toBeInTheDocument();
      expect(label).toHaveTextContent('Label Text');
    });

    it('renders with inset prop', () => {
      render(<DropdownMenuLabel inset>Inset Label</DropdownMenuLabel>);
      
      const label = screen.getByTestId('dropdown-label');
      expect(label).toHaveClass('pl-8');
    });

    it('renders with custom className', () => {
      render(<DropdownMenuLabel className="custom-label">Custom Label</DropdownMenuLabel>);
      
      const label = screen.getByTestId('dropdown-label');
      expect(label).toHaveClass('custom-label');
    });
  });

  describe('DropdownMenuSeparator', () => {
    it('renders correctly', () => {
      render(<DropdownMenuSeparator />);
      
      const separator = screen.getByTestId('dropdown-separator');
      expect(separator).toBeInTheDocument();
    });

    it('renders with custom className', () => {
      render(<DropdownMenuSeparator className="custom-separator" />);
      
      const separator = screen.getByTestId('dropdown-separator');
      expect(separator).toHaveClass('custom-separator');
    });
  });

  describe('DropdownMenuShortcut', () => {
    it('renders correctly', () => {
      render(<DropdownMenuShortcut>Ctrl+S</DropdownMenuShortcut>);
      
      const shortcut = screen.getByText('Ctrl+S');
      expect(shortcut).toBeInTheDocument();
      expect(shortcut).toHaveClass('ml-auto');
      expect(shortcut).toHaveClass('text-xs');
    });

    it('renders with custom className', () => {
      render(<DropdownMenuShortcut className="custom-shortcut">Ctrl+S</DropdownMenuShortcut>);
      
      const shortcut = screen.getByText('Ctrl+S');
      expect(shortcut).toHaveClass('custom-shortcut');
    });
  });

  describe('DropdownMenuSubTrigger', () => {
    it('renders correctly with ChevronRight icon', () => {
      render(<DropdownMenuSubTrigger>Sub Trigger</DropdownMenuSubTrigger>);
      
      const trigger = screen.getByTestId('dropdown-sub-trigger');
      expect(trigger).toBeInTheDocument();
      expect(trigger).toHaveTextContent('Sub Trigger');
      expect(screen.getByTestId('chevron-right-icon')).toBeInTheDocument();
    });

    it('renders with inset prop', () => {
      render(<DropdownMenuSubTrigger inset>Inset Sub Trigger</DropdownMenuSubTrigger>);
      
      const trigger = screen.getByTestId('dropdown-sub-trigger');
      expect(trigger).toHaveClass('pl-8');
    });

    it('renders with custom className', () => {
      render(<DropdownMenuSubTrigger className="custom-sub-trigger">Custom Sub Trigger</DropdownMenuSubTrigger>);
      
      const trigger = screen.getByTestId('dropdown-sub-trigger');
      expect(trigger).toHaveClass('custom-sub-trigger');
    });
  });

  describe('DropdownMenuSubContent', () => {
    it('renders correctly', () => {
      render(<DropdownMenuSubContent>Sub Content</DropdownMenuSubContent>);
      
      const content = screen.getByTestId('dropdown-sub-content');
      expect(content).toBeInTheDocument();
      expect(content).toHaveTextContent('Sub Content');
    });

    it('renders with custom className', () => {
      render(<DropdownMenuSubContent className="custom-sub-content">Custom Sub Content</DropdownMenuSubContent>);
      
      const content = screen.getByTestId('dropdown-sub-content');
      expect(content).toHaveClass('custom-sub-content');
    });
  });

  describe('Integration tests', () => {
    it('renders a complete dropdown menu structure', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem checked>Show Status</DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup value="urgent">
              <DropdownMenuLabel>Priority</DropdownMenuLabel>
              <DropdownMenuRadioItem value="low">Low</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="medium">Medium</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="urgent">Urgent</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>More Options</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Export</DropdownMenuItem>
                <DropdownMenuItem>Import</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              Logout
              <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      
      // Verify the structure renders correctly
      expect(screen.getByTestId('dropdown-root')).toBeInTheDocument();
      expect(screen.getByTestId('dropdown-trigger')).toBeInTheDocument();
      expect(screen.getByTestId('dropdown-content')).toBeInTheDocument();
      expect(screen.getByTestId('dropdown-label')).toBeInTheDocument();
      expect(screen.getAllByTestId('dropdown-separator').length).toBe(5);
      expect(screen.getByTestId('dropdown-group')).toBeInTheDocument();
      expect(screen.getAllByTestId('dropdown-item').length).toBe(4);
      expect(screen.getByTestId('dropdown-checkbox-item')).toBeInTheDocument();
      expect(screen.getByTestId('dropdown-radio-group')).toBeInTheDocument();
      expect(screen.getAllByTestId('dropdown-radio-item').length).toBe(3);
      expect(screen.getByTestId('dropdown-sub')).toBeInTheDocument();
      expect(screen.getByTestId('dropdown-sub-trigger')).toBeInTheDocument();
      expect(screen.getByTestId('dropdown-sub-content')).toBeInTheDocument();
      expect(screen.getByText('⇧⌘Q')).toBeInTheDocument();
    });
  });
});
