/**
 * @openwork/browser-tools
 *
 * AI-enhanced browser automation using Playwright.
 * 100% open source, model-agnostic (works with Claude, OpenAI, Ollama).
 *
 * Features:
 * - Accessibility tree extraction for LLM understanding
 * - Natural language actions via any LLM provider
 * - Smart element identification
 * - Screenshot and DOM analysis
 */

import { chromium, type Browser, type Page, type BrowserContext, type ElementHandle } from 'playwright';
import type { Tool, ToolResult, JSONSchema, AIProvider } from '@openwork/core';

// ============================================================================
// Types
// ============================================================================

/**
 * Configuration for AI-enhanced browser automation
 */
export interface BrowserConfig {
  headless?: boolean;
  viewport?: { width: number; height: number };
  timeout?: number;
}

/**
 * Element representation for LLM consumption
 */
export interface PageElement {
  ref: string; // Unique reference ID for the element
  tag: string;
  role?: string;
  text: string;
  placeholder?: string;
  ariaLabel?: string;
  href?: string;
  type?: string;
  value?: string;
  checked?: boolean;
  disabled?: boolean;
  boundingBox?: { x: number; y: number; width: number; height: number };
}

/**
 * Page state for LLM analysis
 */
export interface PageState {
  url: string;
  title: string;
  elements: PageElement[];
  text: string;
  screenshot?: string; // Base64
}

/**
 * Action result
 */
export interface ActionResult {
  success: boolean;
  message?: string;
  error?: string;
  pageState?: PageState;
}

// ============================================================================
// Accessibility Tree Extraction
// ============================================================================

/**
 * Extract accessibility tree from page for LLM consumption
 *
 * This is the key to model-agnostic browser automation:
 * 1. Extract structured data from the DOM
 * 2. Send to ANY LLM for decision making
 * 3. Execute the returned action
 */
async function extractAccessibilityTree(page: Page, maxElements: number = 100): Promise<PageElement[]> {
  return await page.evaluate((max) => {
    const elements: Array<{
      ref: string;
      tag: string;
      role?: string;
      text: string;
      placeholder?: string;
      ariaLabel?: string;
      href?: string;
      type?: string;
      value?: string;
      checked?: boolean;
      disabled?: boolean;
      boundingBox?: { x: number; y: number; width: number; height: number };
    }> = [];

    // Selectors for interactive elements
    const interactiveSelectors = [
      'button',
      'a[href]',
      'input',
      'select',
      'textarea',
      '[role="button"]',
      '[role="link"]',
      '[role="checkbox"]',
      '[role="radio"]',
      '[role="tab"]',
      '[role="menuitem"]',
      '[role="option"]',
      '[onclick]',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    const nodes = document.querySelectorAll(interactiveSelectors);
    let refCounter = 0;

    nodes.forEach((node) => {
      if (refCounter >= max) return;

      const el = node as HTMLElement;
      const rect = el.getBoundingClientRect();

      // Skip invisible elements
      if (rect.width === 0 || rect.height === 0) return;
      if (window.getComputedStyle(el).visibility === 'hidden') return;
      if (window.getComputedStyle(el).display === 'none') return;

      // Check if element is in viewport
      const inViewport = (
        rect.top < window.innerHeight &&
        rect.bottom > 0 &&
        rect.left < window.innerWidth &&
        rect.right > 0
      );

      if (!inViewport) return;

      const ref = `ref_${refCounter++}`;
      const input = el as HTMLInputElement;

      elements.push({
        ref,
        tag: el.tagName.toLowerCase(),
        role: el.getAttribute('role') || undefined,
        text: (el.innerText || el.textContent || '').trim().substring(0, 100),
        placeholder: input.placeholder || undefined,
        ariaLabel: el.getAttribute('aria-label') || undefined,
        href: (el as HTMLAnchorElement).href || undefined,
        type: input.type || undefined,
        value: input.value || undefined,
        checked: input.checked || undefined,
        disabled: input.disabled || undefined,
        boundingBox: {
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        },
      });
    });

    return elements;
  }, maxElements);
}

/**
 * Format elements for LLM consumption
 */
function formatElementsForLLM(elements: PageElement[]): string {
  return elements
    .map((el) => {
      let desc = `[${el.ref}] <${el.tag}`;
      if (el.role) desc += ` role="${el.role}"`;
      if (el.type) desc += ` type="${el.type}"`;
      desc += '>';

      if (el.text) desc += ` "${el.text}"`;
      if (el.placeholder) desc += ` (placeholder: "${el.placeholder}")`;
      if (el.ariaLabel) desc += ` [aria-label: "${el.ariaLabel}"]`;
      if (el.href) desc += ` → ${el.href.substring(0, 50)}`;
      if (el.value) desc += ` [value: "${el.value}"]`;
      if (el.checked) desc += ` [checked]`;
      if (el.disabled) desc += ` [disabled]`;

      return desc;
    })
    .join('\n');
}

// ============================================================================
// Browser Automation Class
// ============================================================================

/**
 * AI-Enhanced Browser Automation
 *
 * Provides both low-level Playwright control and high-level AI-friendly interfaces.
 */
export class BrowserAutomation {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private config: BrowserConfig;
  private elementRefs: Map<string, string> = new Map(); // ref -> selector

  constructor(config: BrowserConfig = {}) {
    this.config = {
      headless: true,
      viewport: { width: 1280, height: 720 },
      timeout: 30000,
      ...config,
    };
  }

  /**
   * Launch the browser
   */
  async launch(): Promise<void> {
    this.browser = await chromium.launch({
      headless: this.config.headless,
    });

    this.context = await this.browser.newContext({
      viewport: this.config.viewport,
    });

    this.page = await this.context.newPage();
    this.page.setDefaultTimeout(this.config.timeout ?? 30000);
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
      this.elementRefs.clear();
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
  async navigate(url: string): Promise<ActionResult> {
    if (!this.page) return { success: false, error: 'Browser not launched' };

    try {
      await this.page.goto(url, { waitUntil: 'domcontentloaded' });
      return { success: true, message: `Navigated to ${url}` };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * Get the current page state for LLM analysis
   */
  async getPageState(includeScreenshot: boolean = false): Promise<PageState> {
    if (!this.page) throw new Error('Browser not launched');

    const [url, title, elements, text] = await Promise.all([
      this.page.url(),
      this.page.title(),
      extractAccessibilityTree(this.page),
      this.page.innerText('body').catch(() => ''),
    ]);

    // Store element refs for later use
    this.elementRefs.clear();
    elements.forEach((el, index) => {
      // Create a unique selector for each element
      this.elementRefs.set(el.ref, `[data-openwork-ref="${el.ref}"]`);
    });

    // Mark elements with refs
    await this.page.evaluate((els: PageElement[]) => {
      els.forEach((el, index) => {
        const selector = getElementByIndex(index);
        if (selector) {
          selector.setAttribute('data-openwork-ref', el.ref);
        }
      });

      function getElementByIndex(index: number): Element | null {
        const interactiveSelectors = [
          'button',
          'a[href]',
          'input',
          'select',
          'textarea',
          '[role="button"]',
          '[role="link"]',
          '[role="checkbox"]',
          '[role="radio"]',
          '[role="tab"]',
          '[role="menuitem"]',
          '[role="option"]',
          '[onclick]',
          '[tabindex]:not([tabindex="-1"])',
        ].join(', ');

        const allElements = document.querySelectorAll(interactiveSelectors);
        return allElements[index] || null;
      }
    }, elements);

    const state: PageState = {
      url,
      title,
      elements,
      text: text.substring(0, 3000),
    };

    if (includeScreenshot) {
      const screenshot = await this.page.screenshot();
      state.screenshot = screenshot.toString('base64');
    }

    return state;
  }

  /**
   * Get formatted page state for LLM prompt
   */
  async getPageStateForLLM(): Promise<string> {
    const state = await this.getPageState();
    const elementsFormatted = formatElementsForLLM(state.elements);

    return `
## Current Page
URL: ${state.url}
Title: ${state.title}

## Interactive Elements
${elementsFormatted}

## Page Text (excerpt)
${state.text}
`.trim();
  }

  /**
   * Click an element by reference ID
   */
  async clickByRef(ref: string): Promise<ActionResult> {
    if (!this.page) return { success: false, error: 'Browser not launched' };

    try {
      const selector = `[data-openwork-ref="${ref}"]`;
      await this.page.click(selector, { timeout: 5000 });
      return { success: true, message: `Clicked element ${ref}` };
    } catch (error) {
      return { success: false, error: `Failed to click ${ref}: ${error}` };
    }
  }

  /**
   * Click an element by CSS selector
   */
  async click(selector: string): Promise<ActionResult> {
    if (!this.page) return { success: false, error: 'Browser not launched' };

    try {
      await this.page.click(selector);
      return { success: true, message: `Clicked ${selector}` };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * Type text into an element by reference ID
   */
  async typeByRef(ref: string, text: string): Promise<ActionResult> {
    if (!this.page) return { success: false, error: 'Browser not launched' };

    try {
      const selector = `[data-openwork-ref="${ref}"]`;
      await this.page.fill(selector, text);
      return { success: true, message: `Typed "${text}" into ${ref}` };
    } catch (error) {
      return { success: false, error: `Failed to type into ${ref}: ${error}` };
    }
  }

  /**
   * Type text into an element
   */
  async type(selector: string, text: string): Promise<ActionResult> {
    if (!this.page) return { success: false, error: 'Browser not launched' };

    try {
      await this.page.fill(selector, text);
      return { success: true, message: `Typed "${text}" into ${selector}` };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * Press a keyboard key
   */
  async pressKey(key: string): Promise<ActionResult> {
    if (!this.page) return { success: false, error: 'Browser not launched' };

    try {
      await this.page.keyboard.press(key);
      return { success: true, message: `Pressed ${key}` };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * Scroll the page
   */
  async scroll(direction: 'up' | 'down' | 'left' | 'right', amount: number = 300): Promise<ActionResult> {
    if (!this.page) return { success: false, error: 'Browser not launched' };

    try {
      const scrollMap = {
        up: { x: 0, y: -amount },
        down: { x: 0, y: amount },
        left: { x: -amount, y: 0 },
        right: { x: amount, y: 0 },
      };

      const { x, y } = scrollMap[direction];
      await this.page.mouse.wheel(x, y);
      return { success: true, message: `Scrolled ${direction} by ${amount}px` };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * Take a screenshot
   */
  async screenshot(): Promise<{ success: boolean; screenshot?: string; error?: string }> {
    if (!this.page) return { success: false, error: 'Browser not launched' };

    try {
      const screenshotBuffer = await this.page.screenshot();
      return { success: true, screenshot: screenshotBuffer.toString('base64') };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * Wait for an element to appear
   */
  async waitForElement(selector: string, timeout: number = 10000): Promise<ActionResult> {
    if (!this.page) return { success: false, error: 'Browser not launched' };

    try {
      await this.page.waitForSelector(selector, { timeout });
      return { success: true, message: `Element ${selector} appeared` };
    } catch (error) {
      return { success: false, error: `Timeout waiting for ${selector}` };
    }
  }

  /**
   * Wait for navigation to complete
   */
  async waitForNavigation(timeout: number = 30000): Promise<ActionResult> {
    if (!this.page) return { success: false, error: 'Browser not launched' };

    try {
      await this.page.waitForLoadState('domcontentloaded', { timeout });
      return { success: true, message: 'Navigation complete' };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * Select an option from a dropdown by reference ID
   */
  async selectByRef(ref: string, value: string): Promise<ActionResult> {
    if (!this.page) return { success: false, error: 'Browser not launched' };

    try {
      const selector = `[data-openwork-ref="${ref}"]`;
      await this.page.selectOption(selector, value);
      return { success: true, message: `Selected "${value}" in ${ref}` };
    } catch (error) {
      return { success: false, error: `Failed to select in ${ref}: ${error}` };
    }
  }

  /**
   * Check or uncheck a checkbox by reference ID
   */
  async checkByRef(ref: string, checked: boolean = true): Promise<ActionResult> {
    if (!this.page) return { success: false, error: 'Browser not launched' };

    try {
      const selector = `[data-openwork-ref="${ref}"]`;
      if (checked) {
        await this.page.check(selector);
      } else {
        await this.page.uncheck(selector);
      }
      return { success: true, message: `${checked ? 'Checked' : 'Unchecked'} ${ref}` };
    } catch (error) {
      return { success: false, error: `Failed to ${checked ? 'check' : 'uncheck'} ${ref}: ${error}` };
    }
  }

  /**
   * Hover over an element by reference ID
   */
  async hoverByRef(ref: string): Promise<ActionResult> {
    if (!this.page) return { success: false, error: 'Browser not launched' };

    try {
      const selector = `[data-openwork-ref="${ref}"]`;
      await this.page.hover(selector);
      return { success: true, message: `Hovered over ${ref}` };
    } catch (error) {
      return { success: false, error: `Failed to hover over ${ref}: ${error}` };
    }
  }
}

// ============================================================================
// LLM Action Prompts
// ============================================================================

/**
 * System prompt for browser agent
 */
export const BROWSER_AGENT_SYSTEM_PROMPT = `You are a browser automation agent. You can interact with web pages using the following actions:

AVAILABLE ACTIONS:
- click(ref): Click an element by its reference ID (e.g., ref_0, ref_1)
- type(ref, text): Type text into an input field
- select(ref, value): Select an option from a dropdown
- check(ref): Check a checkbox
- uncheck(ref): Uncheck a checkbox
- hover(ref): Hover over an element
- scroll(direction): Scroll the page (up, down, left, right)
- press(key): Press a keyboard key (Enter, Tab, Escape, etc.)
- navigate(url): Navigate to a URL
- wait(): Wait for the page to load

RESPONSE FORMAT:
Always respond with a JSON object:
{
  "thought": "Brief explanation of what you're doing and why",
  "action": "action_name",
  "params": { "param1": "value1" }
}

EXAMPLES:
{"thought": "I need to click the login button", "action": "click", "params": {"ref": "ref_3"}}
{"thought": "Entering the email address", "action": "type", "params": {"ref": "ref_5", "text": "user@example.com"}}
{"thought": "Need to scroll down to see more content", "action": "scroll", "params": {"direction": "down"}}
{"thought": "Submitting the form", "action": "press", "params": {"key": "Enter"}}

IMPORTANT:
- Always use element reference IDs (ref_X) when interacting with elements
- Describe your reasoning in the "thought" field
- One action per response
- If the task is complete, respond with {"thought": "Task complete", "action": "done", "params": {}}
`;

/**
 * Parse LLM action response
 */
export function parseLLMAction(response: string): {
  thought: string;
  action: string;
  params: Record<string, unknown>;
} | null {
  try {
    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      thought: parsed.thought || '',
      action: parsed.action || 'unknown',
      params: parsed.params || {},
    };
  } catch {
    return null;
  }
}

/**
 * Execute a parsed LLM action
 */
export async function executeLLMAction(
  browser: BrowserAutomation,
  action: { action: string; params: Record<string, unknown> }
): Promise<ActionResult> {
  const { action: actionName, params } = action;

  switch (actionName) {
    case 'click':
      return browser.clickByRef(params.ref as string);

    case 'type':
      return browser.typeByRef(params.ref as string, params.text as string);

    case 'select':
      return browser.selectByRef(params.ref as string, params.value as string);

    case 'check':
      return browser.checkByRef(params.ref as string, true);

    case 'uncheck':
      return browser.checkByRef(params.ref as string, false);

    case 'hover':
      return browser.hoverByRef(params.ref as string);

    case 'scroll':
      return browser.scroll(params.direction as 'up' | 'down' | 'left' | 'right');

    case 'press':
      return browser.pressKey(params.key as string);

    case 'navigate':
      return browser.navigate(params.url as string);

    case 'wait':
      return browser.waitForNavigation();

    case 'done':
      return { success: true, message: 'Task completed' };

    default:
      return { success: false, error: `Unknown action: ${actionName}` };
  }
}

// ============================================================================
// Browser Tools for Orchestrator
// ============================================================================

/**
 * Create browser tools for the OpenWork orchestrator
 */
export function createBrowserTools(browser?: BrowserAutomation): Tool[] {
  let automation = browser;

  const ensureBrowser = async (): Promise<BrowserAutomation> => {
    if (!automation) {
      automation = new BrowserAutomation({ headless: true });
      await automation.launch();
    }
    return automation;
  };

  return [
    {
      name: 'browser_navigate',
      description: 'Navigate the browser to a URL',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'URL to navigate to' },
        },
        required: ['url'],
      },
      execute: async (input: unknown): Promise<ToolResult> => {
        const { url } = input as { url: string };
        const b = await ensureBrowser();
        const result = await b.navigate(url);
        return {
          success: result.success,
          output: result.message,
          error: result.error,
        };
      },
    },
    {
      name: 'browser_get_state',
      description: 'Get the current page state including all interactive elements. Use this to understand what actions are available.',
      inputSchema: {
        type: 'object',
        properties: {
          includeScreenshot: {
            type: 'boolean',
            description: 'Whether to include a screenshot',
          },
        },
        required: [],
      },
      execute: async (input: unknown): Promise<ToolResult> => {
        const { includeScreenshot } = input as { includeScreenshot?: boolean };
        try {
          const b = await ensureBrowser();
          const state = await b.getPageStateForLLM();
          return { success: true, output: state };
        } catch (error) {
          return { success: false, error: String(error) };
        }
      },
    },
    {
      name: 'browser_click',
      description: 'Click an element by its reference ID (e.g., ref_0, ref_1). Use browser_get_state first to see available elements.',
      inputSchema: {
        type: 'object',
        properties: {
          ref: {
            type: 'string',
            description: 'Reference ID of the element to click (e.g., ref_0)',
          },
        },
        required: ['ref'],
      },
      execute: async (input: unknown): Promise<ToolResult> => {
        const { ref } = input as { ref: string };
        const b = await ensureBrowser();
        const result = await b.clickByRef(ref);
        return {
          success: result.success,
          output: result.message,
          error: result.error,
        };
      },
    },
    {
      name: 'browser_type',
      description: 'Type text into an input field by its reference ID',
      inputSchema: {
        type: 'object',
        properties: {
          ref: {
            type: 'string',
            description: 'Reference ID of the input element',
          },
          text: {
            type: 'string',
            description: 'Text to type',
          },
        },
        required: ['ref', 'text'],
      },
      execute: async (input: unknown): Promise<ToolResult> => {
        const { ref, text } = input as { ref: string; text: string };
        const b = await ensureBrowser();
        const result = await b.typeByRef(ref, text);
        return {
          success: result.success,
          output: result.message,
          error: result.error,
        };
      },
    },
    {
      name: 'browser_scroll',
      description: 'Scroll the page in a direction',
      inputSchema: {
        type: 'object',
        properties: {
          direction: {
            type: 'string',
            enum: ['up', 'down', 'left', 'right'],
            description: 'Direction to scroll',
          },
          amount: {
            type: 'number',
            description: 'Amount to scroll in pixels (default: 300)',
          },
        },
        required: ['direction'],
      },
      execute: async (input: unknown): Promise<ToolResult> => {
        const { direction, amount } = input as {
          direction: 'up' | 'down' | 'left' | 'right';
          amount?: number;
        };
        const b = await ensureBrowser();
        const result = await b.scroll(direction, amount);
        return {
          success: result.success,
          output: result.message,
          error: result.error,
        };
      },
    },
    {
      name: 'browser_press_key',
      description: 'Press a keyboard key (Enter, Tab, Escape, ArrowDown, etc.)',
      inputSchema: {
        type: 'object',
        properties: {
          key: {
            type: 'string',
            description: 'Key to press',
          },
        },
        required: ['key'],
      },
      execute: async (input: unknown): Promise<ToolResult> => {
        const { key } = input as { key: string };
        const b = await ensureBrowser();
        const result = await b.pressKey(key);
        return {
          success: result.success,
          output: result.message,
          error: result.error,
        };
      },
    },
    {
      name: 'browser_screenshot',
      description: 'Take a screenshot of the current page',
      inputSchema: {
        type: 'object',
        properties: {},
        required: [],
      },
      execute: async (): Promise<ToolResult> => {
        const b = await ensureBrowser();
        const result = await b.screenshot();
        return {
          success: result.success,
          output: result.screenshot
            ? { type: 'image', base64: result.screenshot }
            : undefined,
          error: result.error,
        };
      },
    },
    {
      name: 'browser_select',
      description: 'Select an option from a dropdown',
      inputSchema: {
        type: 'object',
        properties: {
          ref: {
            type: 'string',
            description: 'Reference ID of the select element',
          },
          value: {
            type: 'string',
            description: 'Value to select',
          },
        },
        required: ['ref', 'value'],
      },
      execute: async (input: unknown): Promise<ToolResult> => {
        const { ref, value } = input as { ref: string; value: string };
        const b = await ensureBrowser();
        const result = await b.selectByRef(ref, value);
        return {
          success: result.success,
          output: result.message,
          error: result.error,
        };
      },
    },
    {
      name: 'browser_check',
      description: 'Check or uncheck a checkbox',
      inputSchema: {
        type: 'object',
        properties: {
          ref: {
            type: 'string',
            description: 'Reference ID of the checkbox element',
          },
          checked: {
            type: 'boolean',
            description: 'Whether to check (true) or uncheck (false)',
          },
        },
        required: ['ref'],
      },
      execute: async (input: unknown): Promise<ToolResult> => {
        const { ref, checked = true } = input as { ref: string; checked?: boolean };
        const b = await ensureBrowser();
        const result = await b.checkByRef(ref, checked);
        return {
          success: result.success,
          output: result.message,
          error: result.error,
        };
      },
    },
    {
      name: 'browser_wait',
      description: 'Wait for the page to finish loading',
      inputSchema: {
        type: 'object',
        properties: {
          timeout: {
            type: 'number',
            description: 'Maximum time to wait in milliseconds (default: 30000)',
          },
        },
        required: [],
      },
      execute: async (input: unknown): Promise<ToolResult> => {
        const { timeout = 30000 } = input as { timeout?: number };
        const b = await ensureBrowser();
        const result = await b.waitForNavigation(timeout);
        return {
          success: result.success,
          output: result.message,
          error: result.error,
        };
      },
    },
    {
      name: 'browser_close',
      description: 'Close the browser when done with web tasks',
      inputSchema: {
        type: 'object',
        properties: {},
        required: [],
      },
      execute: async (): Promise<ToolResult> => {
        if (automation) {
          await automation.close();
          automation = undefined;
        }
        return { success: true, output: 'Browser closed' };
      },
    },
  ];
}

// ============================================================================
// Exports
// ============================================================================

export { type Browser, type Page, type BrowserContext } from 'playwright';
