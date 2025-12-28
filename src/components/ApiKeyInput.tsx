"use strict";
import * as React from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Settings, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ApiKeyInputProps {
      apiKey: string;
      setApiKey: (key: string) => void;
}

export function ApiKeyInput({ apiKey, setApiKey }: ApiKeyInputProps) {
      const [isOpen, setIsOpen] = React.useState(false);

      return (
            <div className="fixed bottom-4 right-4 z-50">
                  <AnimatePresence>
                        {isOpen && (
                              <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                    className="mb-4 w-72 rounded-lg border bg-card p-4 shadow-lg"
                              >
                                    <div className="flex items-center gap-2 mb-2">
                                          <Key className="h-4 w-4 text-muted-foreground" />
                                          <span className="text-sm font-medium">Gemini API Key</span>
                                    </div>
                                    <Input
                                          type="password"
                                          placeholder="Enter your API Key"
                                          value={apiKey}
                                          onChange={(e) => setApiKey(e.target.value)}
                                          className="text-xs"
                                    />
                                    <p className="mt-2 text-[10px] text-muted-foreground">
                                          Required for live analysis. Leave empty for Mock Mode.
                                    </p>
                              </motion.div>
                        )}
                  </AnimatePresence>
                  <Button
                        variant="outline"
                        size="icon"
                        className="rounded-full shadow-md bg-background"
                        onClick={() => setIsOpen(!isOpen)}
                  >
                        <Settings className="h-4 w-4" />
                  </Button>
            </div>
      );
}
