"use strict";
import { Search } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';

interface ArtworkFormProps {
      title: string;
      setTitle: (title: string) => void;
      artist: string;
      setArtist: (artist: string) => void;
      onSubmit: (e: React.FormEvent) => void;
      loading: boolean;
}

export function ArtworkForm({
      title,
      setTitle,
      artist,
      setArtist,
      onSubmit,
      loading
}: ArtworkFormProps) {
      return (
            <form onSubmit={onSubmit} className="flex flex-col gap-4 w-full max-w-2xl mx-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative flex items-center">
                              <Search className="absolute left-3 h-5 w-5 text-muted-foreground" />
                              <Input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Titolo dell'opera..."
                                    className="pl-10 h-14 text-lg bg-white/50 backdrop-blur-sm border-secondary shadow-sm transition-all focus:shadow-md focus:border-accent/50 rounded-full"
                              />
                        </div>
                        <div className="relative flex items-center">
                              <Input
                                    value={artist}
                                    onChange={(e) => setArtist(e.target.value)}
                                    placeholder="Nome dell'artista (opzionale)..."
                                    className="h-14 text-lg bg-white/50 backdrop-blur-sm border-secondary shadow-sm transition-all focus:shadow-md focus:border-accent/50 rounded-full"
                              />
                        </div>
                  </div>
                  <Button
                        type="submit"
                        disabled={loading || !title.trim()}
                        className="h-14 rounded-full text-lg font-medium shadow-sm hover:shadow-md transition-all w-full md:w-48 mx-auto"
                  >
                        {loading ? "Analisi..." : "Analizza"}
                  </Button>
            </form>
      );
}
