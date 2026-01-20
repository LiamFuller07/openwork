import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Select from "@radix-ui/react-select";
import { X, Eye, EyeOff, Check, ChevronDown, ExternalLink } from "lucide-react";
import { useStore, PROVIDERS, MODELS, type AIProvider } from "../store";
import { ToastContainer, useToast } from "./ui/Toast";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const {
    selectedProvider,
    setSelectedProvider,
    selectedModel,
    setSelectedModel,
    setApiKey,
  } = useStore();

  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [keyInputs, setKeyInputs] = useState<Record<string, string>>({});
  const [hotkeyValue, setHotkeyValue] = useState("");
  const [currentHotkey, setCurrentHotkey] = useState("");
  const [hotkeyError, setHotkeyError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const { toasts, showToast, removeToast } = useToast();

  const defaultHotkey = "CommandOrControl+;";

  const handleProviderChange = (provider: AIProvider) => {
    setSelectedProvider(provider);
  };

  const handleSaveKey = async (provider: AIProvider) => {
    const key = keyInputs[provider];
    if (key) {
      setApiKey(provider, key);
      await window.openwork?.storeApiKey(provider, key);
      setKeyInputs({ ...keyInputs, [provider]: "" });
    }
  };

  const toggleShowKey = (provider: string) => {
    setShowKeys({ ...showKeys, [provider]: !showKeys[provider] });
  };

  useEffect(() => {
    if (!open) {
      setIsRecording(false);
      return;
    }

    let active = true;
    setHotkeyError(null);

    Promise.resolve(window.openwork?.getGlobalHotkey?.())
      .then((value) => {
        if (!active) return;
        const resolved = value || defaultHotkey;
        setHotkeyValue(resolved);
        setCurrentHotkey(resolved);
      })
      .catch(() => {
        if (!active) return;
        setHotkeyValue(defaultHotkey);
        setCurrentHotkey(defaultHotkey);
      });

    return () => {
      active = false;
    };
  }, [defaultHotkey, open]);

  useEffect(() => {
    if (!isRecording) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsRecording(false);
        return;
      }

      const modifiers: string[] = [];
      if (event.metaKey || event.ctrlKey) modifiers.push("CommandOrControl");
      if (event.altKey) modifiers.push("Alt");
      if (event.shiftKey) modifiers.push("Shift");

      const key = event.key.length === 1 ? event.key.toUpperCase() : event.key;
      if (["Shift", "Alt", "Control", "Meta"].includes(key)) {
        return;
      }

      const accelerator = [...modifiers, key].join("+");
      if (!accelerator) {
        return;
      }

      event.preventDefault();
      setHotkeyError(null);
      setHotkeyValue(accelerator);
      setIsRecording(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isRecording]);

  const handleSaveHotkey = async () => {
    setHotkeyError(null);
    const result = await window.openwork?.setGlobalHotkey?.(hotkeyValue);
    if (!result?.ok) {
      const errorMsg = result?.error ?? "Failed to save hotkey";
      setHotkeyError(errorMsg);
      setHotkeyValue(result?.active ?? currentHotkey);
      showToast(errorMsg, "error");
      return;
    }
    setCurrentHotkey(result.active);
    setHotkeyValue(result.active);
    showToast(`Hotkey saved: ${result.active}`, "success");
  };

  const handleResetHotkey = async () => {
    setHotkeyError(null);
    const result = await window.openwork?.resetGlobalHotkey?.();
    if (!result?.ok) {
      const errorMsg = result?.error ?? "Failed to reset hotkey";
      setHotkeyError(errorMsg);
      setHotkeyValue(result?.active ?? currentHotkey);
      showToast(errorMsg, "error");
      return;
    }
    setCurrentHotkey(result.active);
    setHotkeyValue(result.active);
    showToast(`Hotkey reset to default: ${result.active}`, "success");
  };

  const startRecording = () => {
    setHotkeyError(null);
    setIsRecording(true);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        <Dialog.Content
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                                   w-full max-w-lg bg-[var(--bg-base)] rounded-2xl shadow-xl
                                   border border-[var(--border-default)] p-6 animate-fade-in"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-xl font-semibold text-[var(--fg-default)]">
              Settings
            </Dialog.Title>
            <Dialog.Close className="p-2 hover:bg-[var(--bg-subtle)] rounded-lg transition-colors">
              <X className="w-5 h-5 text-[var(--fg-muted)]" />
            </Dialog.Close>
          </div>

          {/* Global Hotkey */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-[var(--fg-muted)] mb-3">
              Global Hotkey
            </label>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                aria-label="Global hotkey"
                value={hotkeyValue}
                onChange={(event) => setHotkeyValue(event.target.value)}
                placeholder={defaultHotkey}
                className="flex-1 px-4 py-2.5 border border-[var(--border-default)] rounded-lg
                           focus:outline-none focus:border-[var(--accent)]
                           text-[var(--fg-default)] placeholder:text-[var(--fg-muted)]"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={startRecording}
                  className="px-3 py-2.5 rounded-lg border border-[var(--border-default)]
                             hover:border-[var(--border-strong)] transition-colors"
                >
                  {isRecording ? "Recording..." : "Record"}
                </button>
                <button
                  type="button"
                  onClick={handleSaveHotkey}
                  className="px-3 py-2.5 bg-[var(--accent)] text-white rounded-lg
                             hover:bg-[var(--accent-hover)] transition-colors"
                >
                  Save hotkey
                </button>
                <button
                  type="button"
                  onClick={handleResetHotkey}
                  className="px-3 py-2.5 rounded-lg border border-[var(--border-default)]
                             hover:border-[var(--border-strong)] transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>
            {hotkeyError && (
              <p className="text-xs text-red-600 mt-2">{hotkeyError}</p>
            )}
            <p className="text-xs text-[var(--fg-subtle)] mt-2">
              Default: CommandOrControl+; (Cmd+; on macOS, Ctrl+; elsewhere)
            </p>
          </div>

          {/* Provider Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-[var(--fg-muted)] mb-3">
              AI Provider
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PROVIDERS.map((provider) => (
                <button
                  key={provider.id}
                  onClick={() => handleProviderChange(provider.id)}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    selectedProvider === provider.id
                      ? "border-[var(--accent)] bg-[var(--accent)]/5"
                      : "border-[var(--border-default)] hover:border-[var(--border-strong)]"
                  }`}
                >
                  <div className="text-sm font-medium text-[var(--fg-default)]">
                    {provider.name}
                  </div>
                  <div className="text-xs text-[var(--fg-subtle)]">
                    {provider.company}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Model Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-[var(--fg-muted)] mb-3">
              Model
            </label>
            <Select.Root value={selectedModel} onValueChange={setSelectedModel}>
              <Select.Trigger
                className="w-full flex items-center justify-between px-4 py-3
                                         border border-[var(--border-default)] rounded-xl
                                         hover:border-[var(--border-strong)] transition-colors text-left"
              >
                <Select.Value />
                <Select.Icon>
                  <ChevronDown className="w-4 h-4 text-[var(--fg-muted)]" />
                </Select.Icon>
              </Select.Trigger>
              <Select.Portal>
                <Select.Content className="bg-[var(--bg-base)] border border-[var(--border-default)] rounded-xl shadow-lg p-1 z-50">
                  <Select.Viewport>
                    {MODELS[selectedProvider].map((model) => (
                      <Select.Item
                        key={model}
                        value={model}
                        className="px-4 py-2 rounded-lg cursor-pointer
                                   hover:bg-[var(--bg-subtle)] outline-none
                                   data-[highlighted]:bg-[var(--bg-subtle)]
                                   flex items-center justify-between"
                      >
                        <Select.ItemText>{model}</Select.ItemText>
                        <Select.ItemIndicator>
                          <Check className="w-4 h-4 text-[var(--accent)]" />
                        </Select.ItemIndicator>
                      </Select.Item>
                    ))}
                  </Select.Viewport>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
          </div>

          {/* API Keys */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-[var(--fg-muted)] mb-3">
              API Keys
            </label>
            <div className="space-y-3">
              {PROVIDERS.filter((p) => p.requiresKey).map((provider) => (
                <div key={provider.id} className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <input
                      type={showKeys[provider.id] ? "text" : "password"}
                      placeholder={`${provider.name} API Key`}
                      value={keyInputs[provider.id] || ""}
                      onChange={(e) =>
                        setKeyInputs({
                          ...keyInputs,
                          [provider.id]: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 pr-10 border border-[var(--border-default)] rounded-lg
                                 focus:outline-none focus:border-[var(--accent)]
                                 text-[var(--fg-default)] placeholder:text-[var(--fg-muted)]"
                    />
                    <button
                      onClick={() => toggleShowKey(provider.id)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--fg-muted)]"
                    >
                      {showKeys[provider.id] ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <button
                    onClick={() => handleSaveKey(provider.id)}
                    disabled={!keyInputs[provider.id]}
                    className="px-4 py-2.5 bg-[var(--accent)] text-white rounded-lg
                               disabled:bg-[var(--bg-muted)] disabled:text-[var(--fg-muted)] disabled:cursor-not-allowed
                               hover:bg-[var(--accent-hover)] transition-colors"
                  >
                    Save
                  </button>
                </div>
              ))}
            </div>
            <p className="text-xs text-[var(--fg-subtle)] mt-2">
              API keys are stored securely on your device.
            </p>
          </div>

          {/* Links */}
          <div className="pt-4 border-t border-[var(--border-default)]">
            <div className="flex items-center justify-between text-sm">
              <button
                onClick={() =>
                  window.openwork?.openExternal(
                    "https://github.com/openwork-ai/openwork",
                  )
                }
                className="flex items-center gap-1 text-[var(--fg-muted)] hover:text-[var(--fg-default)] transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                GitHub
              </button>
              <span className="text-[var(--fg-subtle)]">OpenWork v0.1.0</span>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </Dialog.Root>
  );
}
