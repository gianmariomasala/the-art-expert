import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import { exportConceptsToPdf } from '@/lib/pdf-export';

export interface Concept {
      title: string;
      description: string;
}

interface ConceptDisplayProps {
      concepts: Concept[];
      title: string;
      artist: string;
}

export function ConceptDisplay({ concepts, title, artist }: ConceptDisplayProps) {
      const [isExporting, setIsExporting] = useState(false);

      if (concepts.length === 0) return null;

      const handleExport = async () => {
            setIsExporting(true);
            try {
                  await exportConceptsToPdf(title, artist, null, 'concepts-export-area');
            } catch (error) {
                  console.error("PDF Export failed", error);
                  alert("Si è verificato un errore durante l'esportazione in PDF.");
            } finally {
                  setIsExporting(false);
            }
      };

      return (
            <div className="w-full max-w-5xl mx-auto mt-12 pb-20">
                  <div className="flex justify-end mb-6">
                        <Button
                              onClick={handleExport}
                              disabled={isExporting}
                              variant="outline"
                              className="flex items-center gap-2 border-accent/20 hover:bg-accent/5 text-accent"
                        >
                              {isExporting ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                    <FileDown className="h-4 w-4" />
                              )}
                              {isExporting ? "Generazione PDF..." : "Salva come PDF"}
                        </Button>
                  </div>

                  <div id="concepts-container" className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 bg-transparent p-4 rounded-xl">
                        {concepts.map((concept, index) => (
                              <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                    className={index >= 3 ? "md:col-span-1 lg:col-span-1" : ""}
                              >
                                    <Card className="h-full border-secondary/50 hover:border-accent/40 transition-colors duration-300">
                                          <CardHeader className="pb-3">
                                                <div className="text-xs font-serif text-accent uppercase tracking-widest mb-1">
                                                      Concetto {index + 1}
                                                </div>
                                                <CardTitle className="text-xl">{concept.title}</CardTitle>
                                          </CardHeader>
                                          <CardContent>
                                                <p className="text-sm leading-relaxed text-muted-foreground">
                                                      {concept.description}
                                                </p>
                                          </CardContent>
                                    </Card>
                              </motion.div>
                        ))}
                  </div>
            </div>
      );
}
