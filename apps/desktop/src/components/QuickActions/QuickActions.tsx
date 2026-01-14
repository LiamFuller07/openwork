import { motion } from 'framer-motion';
import {
  FileSpreadsheet,
  BarChart3,
  Layout,
  Sunrise,
  FolderOpen,
  MessageSquare,
} from 'lucide-react';

const QUICK_ACTIONS = [
  {
    id: 'create-file',
    label: 'Create a file',
    icon: FileSpreadsheet,
  },
  {
    id: 'crunch-data',
    label: 'Crunch data',
    icon: BarChart3,
  },
  {
    id: 'make-prototype',
    label: 'Make a prototype',
    icon: Layout,
  },
  {
    id: 'prep-day',
    label: 'Prep for the day',
    icon: Sunrise,
  },
  {
    id: 'organize-files',
    label: 'Organize files',
    icon: FolderOpen,
  },
  {
    id: 'send-message',
    label: 'Send a message',
    icon: MessageSquare,
  },
];

interface QuickActionsProps {
  onActionClick: (actionId: string) => void;
}

export function QuickActions({ onActionClick }: QuickActionsProps) {
  return (
    <div className="bg-white rounded-2xl border border-cream-300/80 p-6 mb-4 shadow-sm">
      <div className="grid grid-cols-3 gap-3">
        {QUICK_ACTIONS.map((action, index) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onActionClick(action.id)}
              className="flex items-center gap-3 p-4 rounded-xl border border-cream-300/60
                         bg-cream-50 hover:bg-cream-100 hover:border-cream-400/60
                         transition-all duration-200 group text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-white border border-cream-300/60
                              flex items-center justify-center flex-shrink-0
                              group-hover:border-cream-400">
                <Icon className="w-5 h-5 text-ink-200" />
              </div>
              <span className="text-ink-300 font-medium text-sm">
                {action.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
