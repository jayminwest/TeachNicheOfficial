import React from "react";
import { render, screen } from "@testing-library/react";
import { Checkbox } from "../checkbox";
import userEvent from "@testing-library/user-event";

describe("Checkbox Component", () => {
  it("renders unchecked by default", () => {
    render(<Checkbox aria-label="Test checkbox" />);
    const checkbox = screen.getByRole("checkbox", { name: "Test checkbox" });
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
  });

  it("renders with custom className", () => {
    render(<Checkbox className="custom-class" aria-label="Test checkbox" />);
    const checkbox = screen.getByRole("checkbox", { name: "Test checkbox" });
    expect(checkbox).toHaveClass("custom-class");
  });

  it("can be checked and unchecked", async () => {
    const user = userEvent.setup();
    render(<Checkbox aria-label="Test checkbox" />);
    const checkbox = screen.getByRole("checkbox", { name: "Test checkbox" });
    
    // Initial state - unchecked
    expect(checkbox).not.toBeChecked();
    
    // Check the checkbox
    await user.click(checkbox);
    expect(checkbox).toHaveAttribute("data-state", "checked");
    
    // Uncheck the checkbox
    await user.click(checkbox);
    expect(checkbox).toHaveAttribute("data-state", "unchecked");
  });

  it("calls onChange handler when clicked", async () => {
    const handleChange = jest.fn();
    const user = userEvent.setup();
    
    render(<Checkbox aria-label="Test checkbox" onCheckedChange={handleChange} />);
    const checkbox = screen.getByRole("checkbox", { name: "Test checkbox" });
    
    await user.click(checkbox);
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith(true);
    
    await user.click(checkbox);
    expect(handleChange).toHaveBeenCalledTimes(2);
    expect(handleChange).toHaveBeenCalledWith(false);
  });

  it("renders in disabled state when disabled prop is true", () => {
    render(<Checkbox disabled aria-label="Disabled checkbox" />);
    const checkbox = screen.getByRole("checkbox", { name: "Disabled checkbox" });
    expect(checkbox).toBeDisabled();
  });

  it("renders the check icon when checked", async () => {
    const user = userEvent.setup();
    render(<Checkbox aria-label="Test checkbox" />);
    const checkbox = screen.getByRole("checkbox", { name: "Test checkbox" });
    
    await user.click(checkbox);
    
    // The check icon is mocked in jest.setup.js
    const checkIcon = screen.getByTestId("check-icon");
    expect(checkIcon).toBeInTheDocument();
  });

  it("can be controlled with defaultChecked prop", () => {
    render(<Checkbox defaultChecked aria-label="Pre-checked checkbox" />);
    const checkbox = screen.getByRole("checkbox", { name: "Pre-checked checkbox" });
    expect(checkbox).toHaveAttribute("data-state", "checked");
  });
});
