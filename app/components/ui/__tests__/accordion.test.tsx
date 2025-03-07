import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/app/components/ui/accordion';
import { axe } from 'jest-axe';

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
    
    // Initially content should not be visible
    expect(screen.queryByText('Content 1')).not.toBeVisible();
    
    // Click to expand
    fireEvent.click(screen.getByText('Trigger 1'));
    expect(screen.getByText('Content 1')).toBeVisible();
    
    // Click again to collapse
    fireEvent.click(screen.getByText('Trigger 1'));
    expect(screen.queryByText('Content 1')).not.toBeVisible();
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
      <Accordion>
        <AccordionItem className="custom-item-class" value="item-1">
          <AccordionTrigger className="custom-trigger-class">Trigger 1</AccordionTrigger>
          <AccordionContent className="custom-content-class">Content 1</AccordionContent>
        </AccordionItem>
      </Accordion>
    );
    
    const item = screen.getByText('Trigger 1').closest('[class*="custom-item-class"]');
    const trigger = screen.getByText('Trigger 1').closest('[class*="custom-trigger-class"]');
    const content = screen.getByText('Content 1').closest('[class*="custom-content-class"]');
    
    expect(item).toHaveClass('custom-item-class');
    expect(trigger).toHaveClass('custom-trigger-class');
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
    expect(screen.queryByText('Content 1')).not.toBeVisible();
    expect(screen.getByText('Content 2')).toBeVisible();
  });
});
