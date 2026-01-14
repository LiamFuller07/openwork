# OpenWork Architecture Guide

This document explains the prompting workflow and UI architecture for OpenWork. Use this guide for manual testing and understanding how the system is designed to work.

---

## Table of Contents

1. [App Flow Overview](#app-flow-overview)
2. [Plan Mode System](#plan-mode-system)
3. [UI Elements & When They Appear](#ui-elements--when-they-appear)
4. [JSON Message Formats](#json-message-formats)
5. [State Management](#state-management)
6. [Current Integration Status](#current-integration-status)
7. [Manual Testing Guide](#manual-testing-guide)

---

## App Flow Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              HomeView                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  "Let's knock something off your list"                          │   │
│  │                                                                  │   │
│  │  [Create file] [Crunch data] [Prototype] [Prep day] [Organize]  │   │
│  │                                                                  │   │
│  │  ┌────────────────────────────────────────────────────────────┐ │   │
│  │  │  Type your task...                          [Let's go →]   │ │   │
│  │  └────────────────────────────────────────────────────────────┘ │   │
│  │                                                                  │   │
│  │  📁 Working directory: ~/Documents/project                       │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ User submits task
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                             WorkingView                                  │
│  ┌──────────────┬───────────────────────────────┬──────────────────┐   │
│  │   Progress   │         Chat Panel             │    Context       │   │
│  │    Panel     │                                │    Sidebar       │   │
│  │  ──────────  │  User: "Create a budget..."   │  ────────────    │   │
│  │  ○ Analyze   │                                │  📄 expenses.csv │   │
│  │  ○ Plan      │  Assistant: "I'll help..."    │  📄 receipts/    │   │
│  │  ○ Execute   │                                │  🔌 Google Drive │   │
│  │  ○ Finalize  │  [Clarification cards]        │                  │   │
│  │              │                                │  ────────────    │   │
│  │  ──────────  │  [Plan approval UI]           │  Artifacts       │   │
│  │  Artifacts   │                                │  📊 budget.xlsx  │   │
│  │  📊 output   │  [Progress indicators]        │                  │   │
│  └──────────────┴───────────────────────────────┴──────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### User Journey

1. **Home Screen**: User selects a working directory and enters a task
2. **Task Submission**: Task is stored in state, view transitions to WorkingView
3. **Plan Mode Begins**: AI analyzes the request
4. **Clarification** (if needed): AI asks questions via JSON format
5. **Plan Presentation**: AI presents step-by-step plan
6. **User Approval**: User approves or modifies the plan
7. **Execution**: Each step is executed with progress updates
8. **Completion**: Artifacts are displayed, user can continue chatting

---

## Plan Mode System

The core of OpenWork is the **Plan Mode** system. Every AI provider (Claude, OpenAI, Ollama) receives the same universal system prompt that instructs them to:

1. **UNDERSTAND** the user's request fully
2. **ANALYZE** what information is needed
3. **ASK** clarifying questions when needed
4. **PLAN** a step-by-step execution approach
5. **PRESENT** the plan for user approval
6. **EXECUTE** only after receiving explicit approval

### Plan Mode Phases

```typescript
type PlanModePhase =
  | 'understanding'      // AI is analyzing the request
  | 'clarifying'         // AI is asking questions
  | 'planning'           // AI is creating the execution plan
  | 'awaiting_approval'  // Plan shown, waiting for user
  | 'executing';         // User approved, executing steps
```

---

## UI Elements & When They Appear

### Progress Panel (Left Sidebar)

**Shows when:** A plan has been created and execution begins

**Updates via:** `progressSteps` state array

```typescript
// Example progress steps
const progressSteps = [
  { id: 'step1', label: 'Analyze expense data', status: 'completed', order: 1 },
  { id: 'step2', label: 'Categorize transactions', status: 'in_progress', order: 2 },
  { id: 'step3', label: 'Generate summary report', status: 'pending', order: 3 },
];
```

**Visual states:**
- `pending` → Gray circle
- `in_progress` → Blue spinning indicator
- `completed` → Green checkmark
- `failed` → Red X

---

### Clarification Cards (Chat Panel)

**Shows when:** AI outputs a JSON block with `"type": "clarification"`

**Example trigger:**
```json
{
  "type": "clarification",
  "question": "What format would you like for the budget?",
  "options": [
    { "id": "xlsx", "label": "Excel (.xlsx)", "description": "Recommended - editable spreadsheet", "shortcut": "1" },
    { "id": "pdf", "label": "PDF Report", "description": "Read-only, good for sharing", "shortcut": "2" },
    { "id": "csv", "label": "CSV File", "description": "Plain data, import anywhere", "shortcut": "3" }
  ],
  "allowCustom": true,
  "allowSkip": false
}
```

**UI renders:**
- Question text at top
- Option cards (clickable)
- Custom text input (if allowCustom: true)
- Skip button (if allowSkip: true)

---

### Context Sidebar (Right)

**Shows when:** Files or integrations are relevant to the current task

**Updates via:** `contextFiles` state array

```typescript
// Example context files
const contextFiles = [
  { id: '1', name: 'expenses.csv', path: '/project/expenses.csv', type: 'file', icon: '📄' },
  { id: '2', name: 'receipts/', path: '/project/receipts/', type: 'folder', icon: '📁' },
  { id: '3', name: 'Google Drive', path: 'gdrive://shared', type: 'integration', icon: '🔌' },
];
```

**Behavior:**
- Files appear as the AI references them
- Clicking a file can open preview or add to context
- Integrations show connected services

---

### Artifacts Section

**Shows when:** AI creates output files, documents, or data

**Updates via:** `artifacts` state array

```typescript
// Example artifacts
const artifacts = [
  { id: 'art1', type: 'file', name: 'budget_report.xlsx', path: '/project/output/budget_report.xlsx', icon: '📊' },
  { id: 'art2', type: 'presentation', name: 'Q4_Summary.pptx', path: '/project/output/Q4_Summary.pptx', icon: '📽️' },
];
```

**AI triggers artifact via:**
```json
{
  "type": "artifact",
  "artifact": {
    "id": "unique-id",
    "type": "file",
    "name": "budget_report.xlsx",
    "path": "/project/output/budget_report.xlsx",
    "preview": "Created budget with 3 sheets: Overview, Details, Charts"
  }
}
```

---

### Plan Approval UI

**Shows when:** AI outputs a JSON block with `"type": "plan"`

**Example trigger:**
```json
{
  "type": "plan",
  "title": "Create Budget Report",
  "steps": [
    { "id": "step1", "label": "Read and parse expenses.csv", "order": 1 },
    { "id": "step2", "label": "Categorize each transaction", "order": 2 },
    { "id": "step3", "label": "Calculate totals by category", "order": 3 },
    { "id": "step4", "label": "Generate Excel report with charts", "order": 4 }
  ],
  "estimatedArtifacts": [
    { "type": "file", "name": "budget_report.xlsx", "description": "Excel file with summary and charts" }
  ]
}
```

**UI renders:**
- Plan title
- Numbered step list
- Expected outputs preview
- [Approve] [Modify] [Cancel] buttons

---

## JSON Message Formats

The AI communicates with the UI by outputting specific JSON formats. The frontend should parse these from the assistant's response.

### 1. Clarification Question
```json
{
  "type": "clarification",
  "question": "Your question here?",
  "options": [
    { "id": "opt1", "label": "Option Label", "description": "Description", "shortcut": "1" }
  ],
  "allowCustom": true,
  "allowSkip": false
}
```

### 2. Execution Plan
```json
{
  "type": "plan",
  "title": "Brief plan title",
  "steps": [
    { "id": "step1", "label": "Step description", "order": 1 }
  ],
  "estimatedArtifacts": [
    { "type": "file", "name": "output.csv", "description": "What this file contains" }
  ]
}
```

### 3. Progress Update
```json
{
  "type": "progress",
  "stepId": "step1",
  "status": "completed",
  "message": "Successfully read 150 transactions"
}
```

### 4. Artifact Creation
```json
{
  "type": "artifact",
  "artifact": {
    "id": "unique-id",
    "type": "file",
    "name": "output.xlsx",
    "path": "/project/output.xlsx",
    "preview": "Preview content here"
  }
}
```

### 5. Context File Reference
```json
{
  "type": "context",
  "file": {
    "id": "ctx1",
    "name": "source.csv",
    "path": "/project/source.csv",
    "type": "file"
  }
}
```

---

## State Management

OpenWork uses Zustand for state management. Key state slices:

### View State
```typescript
viewMode: 'home' | 'working' | 'settings' | 'clarification'
```

### Task State
```typescript
currentTask: {
  id: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress: number;
  subtasks: Task[];
}
```

### Working View State
```typescript
progressSteps: ProgressStep[];     // Steps shown in left panel
artifacts: Artifact[];              // Created outputs
contextFiles: ContextFile[];        // Referenced files
messages: AgentMessage[];           // Chat history
clarificationQuestion: ClarificationQuestion | null;
```

### Session Reset
Call `resetSession()` to clear working state while preserving settings:
```typescript
const { resetSession } = useStore();
resetSession(); // Clears task, messages, artifacts, etc.
```

---

## Current Integration Status

| Feature | UI Ready | Backend Connected |
|---------|----------|-------------------|
| Home View | ✅ | N/A |
| Working View | ✅ | ⚠️ Placeholder |
| Progress Panel | ✅ | ❌ Needs orchestrator |
| Chat Panel | ✅ | ⚠️ No AI response yet |
| Clarification UI | ✅ | ❌ Needs JSON parsing |
| Context Sidebar | ✅ | ❌ Needs file tracking |
| Artifacts | ✅ | ❌ Needs artifact creation |
| Settings | ✅ | ✅ API keys stored |
| Provider Selection | ✅ | ✅ State managed |

### What's Needed to Connect

1. **AgentOrchestrator Integration**: Connect `packages/core/src/orchestrator.ts` to the UI
2. **JSON Response Parsing**: Parse AI responses for JSON blocks (clarification, plan, progress, artifact)
3. **Tool Execution**: Connect file tools to the orchestrator
4. **Streaming**: Stream AI responses to chat panel
5. **Event Handlers**: Wire up `OrchestratorCallbacks` to state updates

---

## Manual Testing Guide

### Test 1: Basic Flow

1. Start the app: `pnpm dev:desktop`
2. Click "Work in a folder" and select a directory
3. Type a task: "Analyze the files in this folder"
4. Click "Let's go"
5. **Expected**:
   - View changes to WorkingView
   - Your task appears as user message
   - Placeholder assistant message appears

### Test 2: Quick Actions

1. From Home, click any quick action card
2. **Expected**: Pre-filled task in input, ready to submit

### Test 3: Settings

1. Click the gear icon
2. Change provider (Claude → OpenAI → Local)
3. Enter API key
4. **Expected**:
   - Model dropdown updates for each provider
   - API key persists across provider changes

### Test 4: Reset Session

1. Start a task (Test 1)
2. Click back arrow or home button
3. Start a new task
4. **Expected**:
   - Previous messages cleared
   - Fresh session starts

### Test 5: UI Elements Visibility

Currently, these elements show placeholder states. When the orchestrator is connected:

| Element | How to Trigger |
|---------|----------------|
| Progress Steps | AI outputs `"type": "plan"` JSON |
| Clarification | AI outputs `"type": "clarification"` JSON |
| Artifacts | AI outputs `"type": "artifact"` JSON |
| Context Files | AI outputs `"type": "context"` JSON |

### Test 6: Theme/Styling

1. Check all views render correctly
2. Verify dark theme colors match design system
3. Test responsive behavior at different window sizes

---

## Development Notes

### Adding Orchestrator Integration

```typescript
// In WorkingView.tsx, after task starts:
import { AgentOrchestrator } from '@openwork/core';

const orchestrator = new AgentOrchestrator();

orchestrator.on('clarification', (question) => {
  setClarificationQuestion(question);
});

orchestrator.on('plan', (steps) => {
  setProgressSteps(steps);
});

orchestrator.on('progress', (update) => {
  updateProgressStep(update.stepId, update.status);
});

orchestrator.on('artifact', (artifact) => {
  addArtifact(artifact);
});

orchestrator.on('message', (chunk) => {
  // Append to current assistant message
});

// Start execution
await orchestrator.runTask(currentTask.description, {
  workingDirectory,
  provider: selectedProvider,
  model: selectedModel,
  apiKey: apiKeys[selectedProvider],
});
```

### Parsing JSON from AI Response

```typescript
function parseStructuredOutput(content: string): ParsedOutput | null {
  const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1]);
      if (parsed.type) {
        return parsed;
      }
    } catch (e) {
      // Not valid JSON, continue as normal message
    }
  }
  return null;
}
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Electron Main Process                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  IPC Handlers: file dialogs, shell commands, window management       │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │ IPC
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           React App (Renderer)                               │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         Zustand Store                                │    │
│  │  viewMode, currentTask, progressSteps, artifacts, messages, etc.    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                      │                                       │
│        ┌────────────────────────────┼────────────────────────────┐          │
│        ▼                            ▼                            ▼          │
│  ┌──────────┐               ┌─────────────┐              ┌────────────┐     │
│  │ HomeView │               │ WorkingView │              │ Settings   │     │
│  │          │               │             │              │            │     │
│  │ - Input  │               │ - Chat      │              │ - Provider │     │
│  │ - Quick  │               │ - Progress  │              │ - API Keys │     │
│  │   Actions│               │ - Context   │              │ - Model    │     │
│  └──────────┘               │ - Artifacts │              └────────────┘     │
│                             └─────────────┘                                  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           @openwork/core                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                      AgentOrchestrator                               │    │
│  │  - Plan Mode System Prompt                                           │    │
│  │  - Task Planning                                                     │    │
│  │  - Progress Tracking                                                 │    │
│  │  - Event Emission (clarification, plan, progress, artifact)          │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                      │                                       │
│        ┌────────────────────────────┼────────────────────────────┐          │
│        ▼                            ▼                            ▼          │
│  ┌──────────────┐           ┌──────────────┐            ┌──────────────┐    │
│  │ Claude SDK   │           │ OpenAI SDK   │            │ Ollama       │    │
│  │ Adapter      │           │ Adapter      │            │ Adapter      │    │
│  └──────────────┘           └──────────────┘            └──────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Next Steps for Contributors

1. **Connect Orchestrator to UI**: Wire up event handlers in WorkingView
2. **Implement JSON Parsing**: Detect and handle structured outputs
3. **Add File Tools**: Connect `@openwork/file-tools` to orchestrator
4. **Streaming Responses**: Display AI responses character-by-character
5. **Browser Automation**: Integrate `@openwork/browser-tools`
6. **MCP Connectors**: Add Google Drive, Calendar, Slack integrations
