import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../tabs';

describe('Tabs Component', () => {
  const renderTabsComponent = () => {
    return render(
      <Tabs defaultValue="tab1" data-testid="tabs-root">
        <TabsList data-testid="tabs-list">
          <TabsTrigger value="tab1" data-testid="tab1-trigger">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2" data-testid="tab2-trigger">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1" data-testid="tab1-content">
          Tab 1 Content
        </TabsContent>
        <TabsContent value="tab2" data-testid="tab2-content">
          Tab 2 Content
        </TabsContent>
      </Tabs>
    );
  };

  it('renders the tabs component correctly', () => {
    renderTabsComponent();
    
    expect(screen.getByTestId('tabs-root')).toBeInTheDocument();
    expect(screen.getByTestId('tabs-list')).toBeInTheDocument();
    expect(screen.getByTestId('tab1-trigger')).toBeInTheDocument();
    expect(screen.getByTestId('tab2-trigger')).toBeInTheDocument();
    
    // Default tab should be visible
    expect(screen.getByTestId('tab1-content')).toBeInTheDocument();
    expect(screen.getByTestId('tab1-content')).toHaveTextContent('Tab 1 Content');
    
    // Other tab content should not be visible
    expect(screen.queryByTestId('tab2-content')).not.toBeVisible();
  });

  it('applies custom className to TabsList', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList className="custom-list-class" data-testid="tabs-list">
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content</TabsContent>
      </Tabs>
    );
    
    const tabsList = screen.getByTestId('tabs-list');
    expect(tabsList).toHaveClass('custom-list-class');
    expect(tabsList).toHaveClass('inline-flex h-10 items-center');
  });

  it('applies custom className to TabsTrigger', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1" className="custom-trigger-class" data-testid="tab1-trigger">
            Tab 1
          </TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content</TabsContent>
      </Tabs>
    );
    
    const tabTrigger = screen.getByTestId('tab1-trigger');
    expect(tabTrigger).toHaveClass('custom-trigger-class');
    expect(tabTrigger).toHaveClass('inline-flex items-center justify-center');
  });

  it('applies custom className to TabsContent', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1" className="custom-content-class" data-testid="tab1-content">
          Content
        </TabsContent>
      </Tabs>
    );
    
    const tabContent = screen.getByTestId('tab1-content');
    expect(tabContent).toHaveClass('custom-content-class');
    expect(tabContent).toHaveClass('mt-2');
  });

  it('switches tabs when clicking on tab triggers', async () => {
    renderTabsComponent();
    const user = userEvent.setup();
    
    // Initially tab1 should be active
    expect(screen.getByTestId('tab1-content')).toBeVisible();
    expect(screen.queryByTestId('tab2-content')).not.toBeVisible();
    
    // Click on tab2
    await user.click(screen.getByTestId('tab2-trigger'));
    
    // Now tab2 should be active
    expect(screen.queryByTestId('tab1-content')).not.toBeVisible();
    expect(screen.getByTestId('tab2-content')).toBeVisible();
    expect(screen.getByTestId('tab2-content')).toHaveTextContent('Tab 2 Content');
  });

  it('handles disabled tabs correctly', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2" disabled data-testid="disabled-tab">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Tab 1 Content</TabsContent>
        <TabsContent value="tab2">Tab 2 Content</TabsContent>
      </Tabs>
    );
    
    const disabledTab = screen.getByTestId('disabled-tab');
    expect(disabledTab).toBeDisabled();
    expect(disabledTab).toHaveClass('disabled:pointer-events-none');
    expect(disabledTab).toHaveClass('disabled:opacity-50');
  });
});
