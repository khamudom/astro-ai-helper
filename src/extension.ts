import * as vscode from "vscode";
import OpenAI from "openai";
import * as dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Track last request time globally
let lastRequestTime = 0;

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "astro-ai-helper.summarizeCode",
      async () => {
        await safeRunAstroAgent("Summarize this Astro component:");
      }
    ),
    vscode.commands.registerCommand(
      "astro-ai-helper.checkAccessibility",
      async () => {
        await safeRunAstroAgent(
          "Check this Astro component for accessibility issues:"
        );
      }
    ),
    vscode.commands.registerCommand("astro-ai-helper.suggestSEO", async () => {
      await safeRunAstroAgent(
        "Suggest SEO improvements for this Astro component:"
      );
    })
  );
}

// Debounce logic to space out API calls
async function safeRunAstroAgent(task: string) {
  const now = Date.now();

  if (now - lastRequestTime < 20000) {
    // Minimum 20 seconds between requests
    vscode.window.showWarningMessage(
      "You are sending requests too quickly. Please wait a few seconds."
    );
    return;
  }

  lastRequestTime = now;

  await runAstroAgent(task);
}

// Original API call logic
async function runAstroAgent(task: string) {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage("No active file.");
    return;
  }

  const fileContent = editor.document.getText();

  try {
    vscode.window.showInformationMessage("Astro AI is processing...");

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert Astro developer assistant.",
        },
        { role: "user", content: `${task}\n\n${fileContent}` },
      ],
    });

    const result = response.choices[0].message?.content;
    if (result) {
      vscode.window.showInformationMessage(result);
    } else {
      vscode.window.showInformationMessage("No response from AI.");
    }
  } catch (error: any) {
    vscode.window.showErrorMessage(`Error: ${error.message}`);
  }
}

export function deactivate() {}
