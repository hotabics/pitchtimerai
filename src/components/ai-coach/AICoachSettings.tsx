// AI Coach Settings Modal - API Key Configuration

import { useState } from 'react';
import { Settings, Key, Check, X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { getApiKey, setApiKey, removeApiKey, hasApiKey } from '@/services/openai';
import { toast } from '@/hooks/use-toast';

interface AICoachSettingsProps {
  trigger?: React.ReactNode;
}

export const AICoachSettings = ({ trigger }: AICoachSettingsProps) => {
  const [open, setOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const hasKey = hasApiKey();
  const currentKey = getApiKey();

  const handleSave = () => {
    if (apiKeyInput.trim()) {
      setApiKey(apiKeyInput.trim());
      toast({
        title: 'API Key Saved',
        description: 'Your OpenAI API key has been stored locally.',
      });
      setApiKeyInput('');
      setOpen(false);
    }
  };

  const handleRemove = () => {
    removeApiKey();
    setApiKeyInput('');
    toast({
      title: 'API Key Removed',
      description: 'Falling back to mock data mode.',
    });
  };

  const maskedKey = currentKey 
    ? `sk-...${currentKey.slice(-4)}`
    : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className="rounded-full">
            <Settings className="w-5 h-5" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            AI Coach Settings
          </DialogTitle>
          <DialogDescription>
            Configure your OpenAI API key for real-time pitch analysis.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Current status */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              {hasKey ? (
                <Check className="w-4 h-4 text-success" />
              ) : (
                <X className="w-4 h-4 text-muted-foreground" />
              )}
              <span className="text-sm">
                {hasKey ? 'API Key configured' : 'No API Key (using mock data)'}
              </span>
            </div>
            {hasKey && (
              <code className="text-xs text-muted-foreground">{maskedKey}</code>
            )}
          </div>

          {/* Input */}
          <div className="space-y-2">
            <Label htmlFor="api-key">OpenAI API Key</Label>
            <div className="relative">
              <Input
                id="api-key"
                type={showKey ? 'text' : 'password'}
                placeholder="sk-..."
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                className="pr-20"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? 'Hide' : 'Show'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Your API key is stored locally in your browser and never sent to our servers.
            </p>
          </div>

          {/* Get API key link */}
          <a
            href="https://platform.openai.com/api-keys"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <ExternalLink className="w-4 h-4" />
            Get your API key from OpenAI
          </a>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {hasKey && (
            <Button variant="destructive" onClick={handleRemove}>
              Remove Key
            </Button>
          )}
          <Button onClick={handleSave} disabled={!apiKeyInput.trim()}>
            Save Key
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
