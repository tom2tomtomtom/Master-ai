import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase-auth-middleware';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// PUT /api/lessons/[id]/notes/[noteId] - Update a note
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  try {
    const user = await requireAuth();

    const body = await request.json();
    const { content, timestamp } = body;

    if (!content || content.trim() === '') {
      return NextResponse.json(
        { error: 'Note content is required' },
        { status: 400 }
      );
    }

    const resolvedParams = await params;
    // Check if note exists and belongs to the user
    const existingNote = await prisma.lessonNote.findUnique({
      where: { id: resolvedParams.noteId },
    });

    if (!existingNote) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      );
    }

    if (existingNote.userId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const note = await prisma.lessonNote.update({
      where: { id: resolvedParams.noteId },
      data: {
        content: content.trim(),
        timestamp: timestamp || null,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(note);
  } catch (error) {
    console.error('Error updating lesson note:', error);
    return NextResponse.json(
      { error: 'Failed to update lesson note' },
      { status: 500 }
    );
  }
}

// DELETE /api/lessons/[id]/notes/[noteId] - Delete a note
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  try {
    const user = await requireAuth();

    const resolvedParams = await params;
    // Check if note exists and belongs to the user
    const existingNote = await prisma.lessonNote.findUnique({
      where: { id: resolvedParams.noteId },
    });

    if (!existingNote) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      );
    }

    if (existingNote.userId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    await prisma.lessonNote.delete({
      where: { id: resolvedParams.noteId },
    });

    return NextResponse.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Error deleting lesson note:', error);
    return NextResponse.json(
      { error: 'Failed to delete lesson note' },
      { status: 500 }
    );
  }
}