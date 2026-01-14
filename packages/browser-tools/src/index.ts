/**
 * @openwork/browser-tools
 *
 * Browser automation tools for OpenWork.
 * Uses Playwright for browser control with AI-friendly interfaces.
 */

import { chromium, type Browser, type Page, type BrowserContext } from 'playwright';
import type { Tool, ToolResult, JSONSchema } from '@openwork/core';

/**
 * Browser automation manager
 */
export class BrowserAutomation {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;

  /**
   * Launch the browser
   */
  async launch(options?: { headless?: boolean }): Promise<void> {
    this.browser = await chromium.launch({
      headless: options?.headless ?? false,
    });
    this.context = await this.browser.newContext();
    this.page = await this.context.newPage();
  }

  /**
   * Close the browser
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.context = null;
      this.page = null;
    }
  }

  /**
   * Get the current page
   */
  getPage(): Page | null {
    return this.page;
  }

  /**
   * Navigate to a URL
   */
  async navigate(url: string): Promise<void> {
    if (!this.page) throw new Error('Browser not launched');
    await this.page.goto(url, { waitUntil: 'networkidle' });
  }

  /**
   * Take a screenshot
   */
  async screenshot(): Promise<Buffer> {
    if (!this.page) throw new Error('Browser not launched');
    return await this.page.screenshot();
  }

  /**
   * Get page content as text (simplified DOM)
   */
  async getPageText(): Promise<string> {
    if (!this.page) throw new Error('Browser not launched');
    return await this.page.innerText('body');
  }

  /**
   * Click an element
   */
  async click(selector: string): Promise<void> {
    if (!this.page) throw new Error('Browser not launched');
    await this.page.click(selector);
  }

  /**
   * Type text into an element
   */
  async type(selector: string, text: string): Promise<void> {
    if (!this.page) throw new Error('Browser not launched');
    await this.page.fill(selector, text);
  }

  /**
   * Get interactive elements on the page
   */
  async getInteractiveElements(): Promise<Array<{
    tag: string;
    text: string;
    selector: string;
    type?: string;
  }>> {
    if (!this.page) throw new Error('Browser not launched');

    return await this.page.evaluate(() => {
      const elements: Array<{
        tag: string;
        text: string;
        selector: string;
        type?: string;
      }> = [];

      // Find buttons, links, inputs
      const interactiveSelectors = 'button, a, input, select, textarea, [role="button"]';
      const nodes = document.querySelectorAll(interactiveSelectors);

      nodes.forEach((node, index) => {
        const el = node as HTMLElement;
        elements.push({
          tag: el.tagName.toLowerCase(),
          text: el.innerText?.trim().substring(0, 100) || el.getAttribute('aria-label') || '',
          selector: `${el.tagName.toLowerCase()}:nth-of-type(${index + 1})`,
          type: (el as HTMLInputElement).type,
        });
      });

      return elements.slice(0, 50); // Limit to 50 elements
    });
  }
}

// ============================================================================
// Browser Tools for Orchestrator
// ============================================================================

/**
 * Navigate tool schema
 */
const NAVIGATE_SCHEMA: JSONSchema = {
  type: 'object',
  properties: {
    url: {
      type: 'string',
      description: 'URL to navigate to',
    },
  },
  required: ['url'],
};

/**
 * Create browser tools for the orchestrator
 */
export function createBrowserTools(automation: BrowserAutomation): Tool[] {
  return [
    {
      name: 'browser_navigate',
      description: 'Navigate the browser to a URL',
      inputSchema: NAVIGATE_SCHEMA,
      execute: async (input: unknown): Promise<ToolResult> => {
        const { url } = input as { url: string };
        try {
          await automation.navigate(url);
          return { success: true, output: { navigatedTo: url } };
        } catch (error) {
          return { success: false, error: String(error) };
        }
      },
    },
    {
      name: 'browser_screenshot',
      description: 'Take a screenshot of the current page',
      inputSchema: { type: 'object', properties: {} },
      execute: async (): Promise<ToolResult> => {
        try {
          const screenshot = await automation.screenshot();
          return {
            success: true,
            output: { screenshot: screenshot.toString('base64') },
          };
        } catch (error) {
          return { success: false, error: String(error) };
        }
      },
    },
    {
      name: 'browser_get_text',
      description: 'Get the text content of the current page',
      inputSchema: { type: 'object', properties: {} },
      execute: async (): Promise<ToolResult> => {
        try {
          const text = await automation.getPageText();
          return { success: true, output: { text: text.substring(0, 5000) } };
        } catch (error) {
          return { success: false, error: String(error) };
        }
      },
    },
    {
      name: 'browser_click',
      description: 'Click an element on the page',
      inputSchema: {
        type: 'object',
        properties: {
          selector: {
            type: 'string',
            description: 'CSS selector of the element to click',
          },
        },
        required: ['selector'],
      },
      execute: async (input: unknown): Promise<ToolResult> => {
        const { selector } = input as { selector: string };
        try {
          await automation.click(selector);
          return { success: true, output: { clicked: selector } };
        } catch (error) {
          return { success: false, error: String(error) };
        }
      },
    },
    {
      name: 'browser_type',
      description: 'Type text into an input field',
      inputSchema: {
        type: 'object',
        properties: {
          selector: {
            type: 'string',
            description: 'CSS selector of the input element',
          },
          text: {
            type: 'string',
            description: 'Text to type',
          },
        },
        required: ['selector', 'text'],
      },
      execute: async (input: unknown): Promise<ToolResult> => {
        const { selector, text } = input as { selector: string; text: string };
        try {
          await automation.type(selector, text);
          return { success: true, output: { typed: text, into: selector } };
        } catch (error) {
          return { success: false, error: String(error) };
        }
      },
    },
    {
      name: 'browser_elements',
      description: 'Get list of interactive elements on the page',
      inputSchema: { type: 'object', properties: {} },
      execute: async (): Promise<ToolResult> => {
        try {
          const elements = await automation.getInteractiveElements();
          return { success: true, output: { elements } };
        } catch (error) {
          return { success: false, error: String(error) };
        }
      },
    },
  ];
}

export { type Browser, type Page } from 'playwright';
