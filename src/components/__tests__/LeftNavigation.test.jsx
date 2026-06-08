import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LeftNavigation from '../LeftNavigation';

describe('LeftNavigation Component', () => {
  const mockOnNavigate = vi.fn();

  beforeEach(() => {
    mockOnNavigate.mockClear();
    localStorage.clear();
  });

  it('renders successfully in collapsed state by default', () => {
    render(
      <LeftNavigation 
        currentView="home" 
        onNavigate={mockOnNavigate} 
        isMobileOpen={false} 
      />
    );

    // Collapsed by default, so it shows the toggle button as "|>"
    const toggleButton = screen.getByTitle('Expand Sidebar');
    expect(toggleButton).toHaveTextContent('|>');

    // Buttons are rendered
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('expands when clicking the toggle button and displays text labels', () => {
    render(
      <LeftNavigation 
        currentView="home" 
        onNavigate={mockOnNavigate} 
        isMobileOpen={false} 
      />
    );

    const toggleButton = screen.getByTitle('Expand Sidebar');
    fireEvent.click(toggleButton);

    // Toggle button should now show collapsed indicator "<|"
    expect(screen.getByTitle('Collapse Sidebar')).toHaveTextContent('<|');

    // Labels should now be visible in the DOM
    expect(screen.getByText('Inference Scheduling')).toBeInTheDocument();
    expect(screen.getByText('Benchmark Browser')).toBeInTheDocument();
  });

  it('calls onNavigate when clicking an active item in expanded state', () => {
    render(
      <LeftNavigation 
        currentView="home" 
        onNavigate={mockOnNavigate} 
        isMobileOpen={false} 
      />
    );

    // Click toggle to expand first
    const toggleButton = screen.getByTitle('Expand Sidebar');
    fireEvent.click(toggleButton);

    // Click "Benchmark Browser"
    const benchmarkItem = screen.getByText('Benchmark Browser');
    fireEvent.click(benchmarkItem);

    expect(mockOnNavigate).toHaveBeenCalledWith('benchmark-browser');
  });

  it('does not call onNavigate when clicking a disabled item', () => {
    render(
      <LeftNavigation 
        currentView="home" 
        onNavigate={mockOnNavigate} 
        isMobileOpen={false} 
      />
    );

    // Expand sidebar
    const toggleButton = screen.getByTitle('Expand Sidebar');
    fireEvent.click(toggleButton);

    // Click on disabled "P/D Disaggregation" which has "COMING SOON" label
    const disabledItem = screen.getByText('P/D Disaggregation');
    fireEvent.click(disabledItem);

    expect(mockOnNavigate).not.toHaveBeenCalled();
  });
});
