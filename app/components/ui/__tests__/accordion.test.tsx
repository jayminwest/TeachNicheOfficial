import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/app/components/ui/accordion';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Accordion Component', () => {
  it('renders without crashing', () => {
    render(
      <Accordion>
        <AccordionItem value="item-1">
          <AccordionTrigger>Trigger 1</AccordionTrigger>
          <AccordionContent>Content 1</AccordionContent>
        </AccordionItem>
      </Accordion>
    );
    
    expect(screen.getByText('Trigger 1')).toBeInTheDocument();
  });

  it('expands and collapses when clicked', () => {
    render(
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
          <AccordionTrigger>Trigger 1</AccordionTrigger>
          <AccordionContent>Content 1</AccordionContent>
        </AccordionItem>
      </Accordion>
    );
    
    // Initially content should be hidden
    const content = screen.getByRole('region', { hidden: true });
    expect(content).not.toBeVisible();
    
    // Click to expand
    fireEvent.click(screen.getByText('Trigger 1'));
    expect(content).toBeVisible();
    
    // Click again to collapse
    fireEvent.click(screen.getByText('Trigger 1'));
    expect(content).not.toBeVisible();
  });

  it('allows multiple items to be open when type is not "single"', () => {
    render(
      <Accordion type="multiple">
        <AccordionItem value="item-1">
          <AccordionTrigger>Trigger 1</AccordionTrigger>
          <AccordionContent>Content 1</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Trigger 2</AccordionTrigger>
          <AccordionContent>Content 2</AccordionContent>
        </AccordionItem>
      </Accordion>
    );
    
    // Open first item
    fireEvent.click(screen.getByText('Trigger 1'));
    expect(screen.getByText('Content 1')).toBeVisible();
    
    // Open second item (first should still be open)
    fireEvent.click(screen.getByText('Trigger 2'));
    expect(screen.getByText('Content 1')).toBeVisible();
    expect(screen.getByText('Content 2')).toBeVisible();
  });

  it('applies custom className to components', () => {
    render(
      <Accordion type="single">
        <AccordionItem className="custom-item-class" value="item-1">
          <AccordionTrigger className="custom-trigger-class">Trigger 1</AccordionTrigger>
          <AccordionContent className="custom-content-class">Content 1</AccordionContent>
        </AccordionItem>
      </Accordion>
    );
    
    // First check the item and trigger classes
    const item = screen.getByText('Trigger 1').closest('[class*="custom-item-class"]');
    const trigger = screen.getByText('Trigger 1').closest('[class*="custom-trigger-class"]');
    
    expect(item).toHaveClass('custom-item-class');
    expect(trigger).toHaveClass('custom-trigger-class');
    
    // Open the accordion to check content class
    fireEvent.click(screen.getByText('Trigger 1'));
    const content = screen.getByText('Content 1').closest('[class*="custom-content-class"]');
    expect(content).toHaveClass('custom-content-class');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <Accordion>
        <AccordionItem value="item-1">
          <AccordionTrigger>Trigger 1</AccordionTrigger>
          <AccordionContent>Content 1</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Trigger 2</AccordionTrigger>
          <AccordionContent>Content 2</AccordionContent>
        </AccordionItem>
      </Accordion>
    );
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('renders with default value when provided', () => {
    render(
      <Accordion type="single" defaultValue="item-2">
        <AccordionItem value="item-1">
          <AccordionTrigger>Trigger 1</AccordionTrigger>
          <AccordionContent>Content 1</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Trigger 2</AccordionTrigger>
          <AccordionContent>Content 2</AccordionContent>
        </AccordionItem>
      </Accordion>
    );
    
    // Item 2 should be open by default
    const trigger1 = screen.getByRole('button', { name: /trigger 1/i });
    const trigger2 = screen.getByRole('button', { name: /trigger 2/i });
    
    // Check that trigger 2 is expanded and trigger 1 is not
    expect(trigger1).toHaveAttribute('aria-expanded', 'false');
    expect(trigger2).toHaveAttribute('aria-expanded', 'true');
    
    // Check content visibility
    expect(screen.getByText('Content 2')).toBeVisible();
    expect(screen.queryByText('Content 1')).not.toBeVisible();
  });
});
