'use client';

import { useState, useRef, useEffect } from 'react';
import { appLogger } from '@/lib/logger';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  Plus, 
  Edit3, 
  Trash2, 
  Save, 
  Search,
  Clock,
  FileText
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface LessonNote {
  id: string;
  content: string;
  timestamp: number | null;
  createdAt: string;
  updatedAt: string;
}

interface NoteTakingPanelProps {
  lessonId: string;
  notes: LessonNote[];
  onNotesChange: (notes: LessonNote[]) => void;
  onClose: () => void;
}

export function NoteTakingPanel({ 
  lessonId, 
  notes, 
  onNotesChange, 
  onClose 
}: NoteTakingPanelProps) {
  const [newNote, setNewNote] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus on textarea when panel opens
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const filteredNotes = notes.filter(note =>
    note.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const createNote = async () => {
    if (!newNote.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/lessons/${lessonId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newNote.trim(),
        }),
      });

      if (response.ok) {
        const createdNote = await response.json();
        onNotesChange([createdNote, ...notes]);
        setNewNote('');
      }
    } catch (error) {
      appLogger.error('Error creating note:', { error: error, component: 'note-taking-panel' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateNote = async (noteId: string) => {
    if (!editContent.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/lessons/${lessonId}/notes/${noteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: editContent.trim(),
        }),
      });

      if (response.ok) {
        const updatedNote = await response.json();
        onNotesChange(notes.map(note => 
          note.id === noteId ? updatedNote : note
        ));
        setEditingNoteId(null);
        setEditContent('');
      }
    } catch (error) {
      appLogger.error('Error updating note:', { error: error, component: 'note-taking-panel' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteNote = async (noteId: string) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/lessons/${lessonId}/notes/${noteId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onNotesChange(notes.filter(note => note.id !== noteId));
      }
    } catch (error) {
      appLogger.error('Error deleting note:', { error: error, component: 'note-taking-panel' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditing = (note: LessonNote) => {
    setEditingNoteId(note.id);
    setEditContent(note.content);
  };

  const cancelEditing = () => {
    setEditingNoteId(null);
    setEditContent('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (editingNoteId) {
        updateNote(editingNoteId);
      } else {
        createNote();
      }
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white dark:bg-gray-800 shadow-xl border-l border-gray-200 dark:border-gray-700 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <FileText className="h-5 w-5 text-blue-600" />
          <h2 className="font-semibold">Notes</h2>
          <Badge variant="secondary">{notes.length}</Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm"
          />
        </div>
      </div>

      {/* New Note */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="space-y-3">
          <Textarea
            ref={textareaRef}
            placeholder="Add a new note..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[80px] resize-none"
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Cmd/Ctrl + Enter to save
            </span>
            <Button 
              size="sm" 
              onClick={createNote}
              disabled={!newNote.trim() || isSubmitting}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Note
            </Button>
          </div>
        </div>
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto">
        {filteredNotes.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm ? 'No notes found' : 'No notes yet'}
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              {searchTerm ? 'Try a different search term' : 'Start taking notes to remember key insights'}
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {filteredNotes.map((note) => (
              <Card key={note.id} className="p-3">
                {editingNoteId === note.id ? (
                  <div className="space-y-3">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="min-h-[80px] resize-none"
                      autoFocus
                    />
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={cancelEditing}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => updateNote(note.id)}
                        disabled={!editContent.trim() || isSubmitting}
                      >
                        <Save className="h-3 w-3 mr-1" />
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                        <Clock className="h-3 w-3" />
                        <span>
                          {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
                        </span>
                        {note.createdAt !== note.updatedAt && (
                          <span>(edited)</span>
                        )}
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditing(note)}
                          disabled={isSubmitting}
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteNote(note.id)}
                          disabled={isSubmitting}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {note.content}
                    </p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Notes are automatically saved and synced across devices
        </p>
      </div>
    </div>
  );
}