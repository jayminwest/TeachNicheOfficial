#!/usr/bin/env python3
"""
Autonomous Iterative Improvement Process with Aider

This tool first asks the user for a high-level idea. It then uses Aider’s chat
(as a substitute for the /ask command) to inspect the code and determine what is
needed to implement the idea. A structured prompt is generated that includes:
  - High-Level Prompt: The overall vision and objectives.
  - Mid-Level Prompt: A breakdown into components and intermediate steps.
  - Low-Level Prompt: Detailed actionable tasks with examples.

The tool then shows the generated prompt to the user and asks for confirmation
to run it. Once confirmed, it uses the structured prompt for code generation,
execution, and evaluation in an iterative process.
"""

# Standard library imports
import argparse
import json
import subprocess
from pathlib import Path
from typing import Optional, List, Literal

# Third-party imports
import yaml
from pydantic import BaseModel
from rich.console import Console
from rich.panel import Panel
from rich.markdown import Markdown
from rich.progress import Progress, SpinnerColumn, TextColumn

# Aider-specific imports
from aider.coders import Coder
from aider.models import Model
from aider.io import InputOutput

# Initialize rich console for pretty output
console = Console()

class EvaluationResult(BaseModel):
    """
    Structured result from code evaluation process.
    
    Attributes:
        success: Whether the evaluation passed successfully
        feedback: Optional feedback message explaining the result
    """
    success: bool
    feedback: Optional[str]

# Query priority for Testing Library
QUERY_PRIORITY = [
    "getByRole",
    "getByLabelText", 
    "getByPlaceholderText",
    "getByText",
    "getByTestId"
]

# Standard test template
TEST_TEMPLATE = '''
describe('{component_name}', () => {
  // Standard test setup
  const mockProps = createMockProps({component_name})
  
  describe('rendering', () => {
    it('renders without crashing', () => {
      render(<{component_name} {...mockProps} />)
    })

    it('renders expected elements', () => {
      const { getByRole } = render(<{component_name} {...mockProps} />)
      // Generated element checks
    })
  })

  describe('interactions', () => {
    it('handles user interactions', async () => {
      const user = userEvent.setup()
      const { getByRole } = render(<{component_name} {...mockProps} />)
      // Generated interaction tests
    })
  })

  describe('props', () => {
    it('handles all required props', () => {
      render(<{component_name} {...mockProps} />)
      // Generated prop validation
    })
  })
})
'''

class AiderAgentConfig(BaseModel):
    """Configuration schema for the Aider Agent."""
    prompt: str
    coder_model: str
    evaluator_model: str
    max_iterations: int
    execution_commands: List[dict]
    context_editable: List[str]
    context_read_only: List[str]
    evaluator: Literal["default"]
    program_type: Literal["script", "long_running"] = "script"
    startup_timeout: int = 5
    health_check_command: Optional[str] = None

class AiderAgent:
    """Autonomous Code Generation and Iterative Improvement System"""

    def __init__(self, config_path: str = "ai_docs/code_gen_tools/auto_aider_config.yaml", prompt_path: Optional[str] = None, component_dir: Optional[str] = None):
        self.config = self._validate_config(Path(config_path), prompt_path)
        self.test_template = TEST_TEMPLATE
        self.query_priority = QUERY_PRIORITY
        self.component_dir = component_dir
        # Initialize Aider's coder (using the model specified in the config)
        self.coder = Coder.create(
            main_model=Model(self.config.coder_model),
            io=InputOutput(yes=True),
            fnames=self.config.context_editable,
            read_only_fnames=self.config.context_read_only,
            auto_commits=False,
            suggest_shell_commands=False
        )

    def _validate_config(self, config_path: Path, prompt_path: Optional[str] = None) -> AiderAgentConfig:
        """Load and validate configuration from YAML and prompt file."""
        if not config_path.exists():
            raise FileNotFoundError(f"Config file not found: {config_path}")

        with open(config_path) as f:
            config_dict = yaml.safe_load(f)

        # Use CLI provided prompt path if available, otherwise use the prompt path from config
        prompt_path = Path(prompt_path) if prompt_path else Path(config_dict["prompt"])
        if not prompt_path.exists():
            raise FileNotFoundError(f"Prompt file not found: {prompt_path}")

        with open(prompt_path) as f:
            config_dict["prompt"] = f.read()

        return AiderAgentConfig(**config_dict)

    def build_structured_prompt(self, high_level_idea: str, iterations: int = 3) -> str:
        """
        Use Aider's run command to generate a structured prompt iteratively.
        Each iteration examines the project structure and refines the prompt.
        """
        current_prompt = high_level_idea
        
        for i in range(iterations):
            console.print(f"\n[bold cyan]Iteration {i+1}/{iterations}[/] - Analyzing project structure and refining prompt...", style="italic")
            
            analyze_prompt = f"""Analyze the current project structure and this idea: "{current_prompt}"
            
Based on the repository map and existing files, suggest improvements to make this prompt more specific and actionable.
Focus on:
1. Technical details that align with existing code
2. Dependencies and requirements already present
3. File structure and organization patterns
4. Coding standards visible in the codebase

Return only the improved prompt idea, no other text."""

            # Get improved high-level idea
            improved_idea = self.coder.run(analyze_prompt).strip()
            current_prompt = improved_idea
            
            console.print(Panel(current_prompt, title="[bold green]Refined Idea", border_style="green"))
            
        # Now generate the final structured prompt
        ask_prompt = f"""Based on thorough analysis of the project structure, implement this idea: "{current_prompt}".
Please analyze this idea and return a JSON response with the following structure:
{{
    "high_level_goals": ["List of high level goals"],
    "mid_level_goals": ["List of concrete, measurable objectives"],
    "implementation_guidelines": {{
        "technical_details": ["Important technical details"],
        "dependencies": ["Dependencies and requirements"],
        "coding_standards": ["Coding standards to follow"],
        "other_guidance": ["Other technical guidance"]
    }},
    "project_context": {{
        "beginning_files": ["List of files that exist at start"],
        "ending_files": ["List of files that will exist at end"]
    }},
    "low_level_goals": [
        {{
            "task": "Task description",
            "prompt": "What instructions you need to complete this task",
            "file": "What file to work on",
            "function": "What function to work on",
            "details": "Additional details for consistency"
        }}
    ]
}}

Do not make any code changes. Only return the JSON response.
"""
        response = self.coder.run(ask_prompt)
        try:
            prompt_json = json.loads(response)
            structured_prompt = "# Architect Prompt Template\n"
            structured_prompt += "Process this file working through each step to ensure each objective is met.\n\n"
            
            # High Level Goals
            structured_prompt += "## High Level Goals\n\n"
            for goal in prompt_json.get('high_level_goals', []):
                structured_prompt += f"- {goal}\n"
            
            # Mid Level Goals
            structured_prompt += "\n## Mid Level Goals\n\n"
            for goal in prompt_json.get('mid_level_goals', []):
                structured_prompt += f"- {goal}\n"
            
            # Implementation Guidelines
            structured_prompt += "\n## Implementation Guidelines\n"
            impl = prompt_json.get('implementation_guidelines', {})
            for detail in impl.get('technical_details', []):
                structured_prompt += f"- {detail}\n"
            for dep in impl.get('dependencies', []):
                structured_prompt += f"- {dep}\n"
            for std in impl.get('coding_standards', []):
                structured_prompt += f"- {std}\n"
            for guide in impl.get('other_guidance', []):
                structured_prompt += f"- {guide}\n"
            
            # Project Context
            structured_prompt += "\n## Project Context\n\n"
            structured_prompt += "### Beginning files\n"
            for file in prompt_json.get('project_context', {}).get('beginning_files', []):
                structured_prompt += f"- {file}\n"
            
            structured_prompt += "\n### Ending files\n"
            for file in prompt_json.get('project_context', {}).get('ending_files', []):
                structured_prompt += f"- {file}\n"
            
            # Low Level Goals
            structured_prompt += "\n## Low Level Goals\n"
            structured_prompt += "> Ordered from first to last\n\n"
            for i, task in enumerate(prompt_json.get('low_level_goals', []), 1):
                structured_prompt += f"{i}. **{task.get('task', '')}**  \n"
                structured_prompt += "```code-example\n"
                structured_prompt += f"What instructions would you need to complete this task? {task.get('prompt', '')}\n"
                structured_prompt += f"What file do you want to work on? {task.get('file', '')}\n"
                structured_prompt += f"What function do you want to work on? {task.get('function', '')}\n"
                structured_prompt += f"What are details you want to add to ensure consistency? {task.get('details', '')}\n"
                structured_prompt += "```\n\n"
        except Exception as e:
            print("Error parsing structured prompt:", e)
            structured_prompt = response  # fallback to raw response
        return structured_prompt

    def generate_code(self, prompt: str):
        """
        Generate code using Aider.
        This step includes the high-, mid-, and low-level details contained in the prompt.
        """
        console.print("[bold blue][A-C][/] Generating/updating code based on the prompt...", style="italic")
        self.coder.run(prompt)

    def _check_program_startup(self) -> str:
        """Check if the program starts successfully within timeout period."""
        try:
            process = subprocess.Popen(
                self.config.execution_command.split(),
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            
            try:
                stdout, stderr = process.communicate(timeout=self.config.startup_timeout)
                return stdout + stderr
            except subprocess.TimeoutExpired:
                process.kill()  # Clean up the process
                return f"Program started successfully and remained running for {self.config.startup_timeout} seconds."
                
        except Exception as e:
            return f"Error executing program: {str(e)}"

    def _perform_health_check(self) -> str:
        """Perform health check if configured."""
        if not self.config.health_check_command:
            return "No health check configured"
            
        try:
            result = subprocess.run(
                self.config.health_check_command.split(),
                capture_output=True,
                text=True,
                timeout=10
            )
            return f"Health check {'passed' if result.returncode == 0 else 'failed'}"
        except subprocess.TimeoutExpired:
            return "Health check timed out"
        except Exception as e:
            return f"Health check error: {str(e)}"

    def execute_code(self) -> dict:
        """
        Execute test and build commands, returning results for each step.
        """
        results = {}
        
        for cmd_config in self.config.execution_commands:
            cmd = cmd_config["command"]
            desc = cmd_config["description"]
            
            console.print(f"[bold blue]Executing {desc}...[/]", style="italic")
            
            try:
                result = subprocess.run(
                    cmd.split(),
                    capture_output=True,
                    text=True,
                    check=True  # This will raise CalledProcessError if exit code != 0
                )
                results[cmd] = {
                    "success": True,
                    "output": result.stdout + result.stderr
                }
                console.print(f"[bold green]✓ {desc} succeeded[/]")
            except subprocess.CalledProcessError as e:
                results[cmd] = {
                    "success": False,
                    "output": e.stdout + e.stderr if e.stdout or e.stderr else str(e)
                }
                console.print(f"[bold red]✗ {desc} failed[/]")
                # Break early if any command fails
                break
                
        return results

    def evaluate_output(self, execution_results: dict) -> EvaluationResult:
        """
        Evaluate the execution results from both test and build steps.
        """
        # Check if all commands succeeded
        all_succeeded = all(result["success"] for result in execution_results.values())
        
        if not all_succeeded:
            # Find first failure
            failed_cmd = next(cmd for cmd, result in execution_results.items() 
                            if not result["success"])
            return EvaluationResult(
                success=False,
                feedback=f"Command failed: {failed_cmd}\nOutput: {execution_results[failed_cmd]['output']}"
            )

        # If everything passed, evaluate the test output
        test_output = execution_results["npm test"]["output"]
        evaluation_prompt = f"""Evaluate the following test execution output:
{test_output}

Return JSON with the structure: {{
    "success": bool,
    "feedback": string or null
}}"""
        response = self.coder.run(evaluation_prompt)
        try:
            evaluation_json = json.loads(response)
            evaluation = EvaluationResult(**evaluation_json)
        except Exception as e:
            console.print("[bold red]Error parsing evaluation response:[/]", str(e))
            evaluation = EvaluationResult(success=False, feedback="Parsing error")
        return evaluation

    def final_review(self) -> bool:
        """
        Perform a final automated review.
        (Step K: Final automated review.)
        """
        review_prompt = "Perform a final automated review of the updated project. Return JSON with structure: {\"review_passed\": bool}"
        console.print("[bold blue][K][/] Performing final automated review...", style="italic")
        response = self.coder.run(review_prompt)
        try:
            review_json = json.loads(response)
            return review_json.get("review_passed", False)
        except Exception as e:
            print("Error parsing final review response:", e)
            return False

    def human_final_verification(self) -> bool:
        """
        Request human final verification.
        (Step L: Human final verification.)
        """
        response = input("Does the final review meet your expectations? (y/n): ").strip().lower()
        return response == "y"

    def run(self):
        """
        Run the autonomous iterative improvement process.
        First, prompt the user for a high-level idea, generate a structured prompt,
        and ask for confirmation before running the iterative process.
        (Steps I & J: Iteratively generate, execute, and evaluate until success.)
        """
        # Step 1: Get high-level idea from the user.
        high_level_idea = input("Enter your high-level idea: ").strip()
        if not high_level_idea:
            print("No idea provided. Exiting.")
            return

        # Step 2: Build a structured prompt using Aider's chat (simulating /ask).
        structured_prompt = self.build_structured_prompt(high_level_idea)
        
        # Save the prompt to JSON file
        prompt_data = json.loads(self.coder.run(f"""I have the following high-level idea: "{high_level_idea}".
Please analyze this idea and return a JSON response with the following structure:
{{
    "high_level": "Overall vision and objectives",
    "mid_level": "Components and intermediate steps",
    "low_level": "Detailed actionable tasks with examples"
}}

Do not make any code changes. Only return the JSON response.
"""))
        
        with open('aider_auto_prompt.json', 'w') as f:
            json.dump(prompt_data, f, indent=2)
            
        console.print("\n[bold green]Generated Structured Prompt:[/]\n")
        console.print(Markdown(structured_prompt))
        console.print("\n[bold]Prompt saved to:[/] aider_auto_prompt.json", style="blue")
        confirm = input("Do you want to run this prompt? (y/n): ").strip().lower()
        if confirm != "y":
            print("Prompt execution canceled.")
            return

        # Use the structured prompt for the iterative improvement process.
        evaluation = EvaluationResult(success=False, feedback=None)
        for i in range(self.config.max_iterations):
            console.print(f"\n[bold cyan]{'='*20} Iteration {i+1}/{self.config.max_iterations} {'='*20}[/]")

            # Generate (and update) code based on the structured prompt
            self.generate_code(structured_prompt)

            # Execute the generated code
            output = self.execute_code()
            console.print(Panel(output, title="[bold blue]Execution Output", border_style="blue"))

            # Evaluate the output
            evaluation = self.evaluate_output(output)
            console.print(Panel(
                f"Success: {evaluation.success}\nFeedback: {evaluation.feedback or 'None'}", 
                title="[bold yellow]Evaluation Result", 
                border_style="yellow"
            ))

            if evaluation.success:
                console.print("[bold green]✓ Automated evaluation indicates success![/]")
                break
            else:
                console.print("[bold red]✗ Automated evaluation did not meet goals.[/]")
                if evaluation.feedback:
                    console.print(f"[yellow]Feedback:[/] {evaluation.feedback}")
                console.print("[italic]Repeating the automated process with updated code generation...[/]\n")

        if evaluation.success:
            # Final automated review (Step K)
            if self.final_review():
                print("Final automated review PASSED!")
            else:
                print("Final automated review FAILED.")
                return

            # Human final verification (Step L)
            if self.human_final_verification():
                print("Human verification PASSED!")
                print("Project updated successfully! (Step M)")
            else:
                print("Human verification FAILED. Please review the changes.")
        else:
            print("Failed to achieve success within maximum iterations")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Autonomous Test Generation and Verification System"
    )
    parser.add_argument(
        "--prompt",
        type=str,
        help="Path to the prompt markdown file",
        default=None
    )
    parser.add_argument(
        "--component-dir",
        type=str,
        help="Directory containing UI components to test",
        default="components/ui"
    )
    args = parser.parse_args()

    agent = AiderAgent(prompt_path=args.prompt, component_dir=args.component_dir)
    
    # Process components directory
    console.print(f"\n[bold blue]Processing components in {args.component_dir}...[/]\n")
    
    # Get list of all component files
    component_path = Path(args.component_dir)
    if not component_path.exists():
        console.print(f"[bold red]Error:[/] Directory not found: {args.component_dir}")
        exit(1)
        
    components = []
    for ext in ["tsx", "ts"]:
        components.extend(component_path.glob(f"*.{ext}"))
    
    if not components:
        console.print(f"[bold yellow]Warning:[/] No components found in {args.component_dir}")
        exit(0)
        
    # Process each component
    for component_file in components:
        console.print(f"\n[bold cyan]Processing component:[/] {component_file.name}")
        
        # Generate test file path
        test_file = Path("__tests__") / component_file.with_suffix(".test.tsx").name
        
        # Create high-level idea for the component
        high_level_idea = f"Generate comprehensive tests for the {component_file.stem} component following the project's testing standards"
        
        # Run the agent
        agent.run()
