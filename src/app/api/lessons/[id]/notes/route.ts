import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase-auth-middleware';
import { PrismaClient } from '@prisma/client';
import { achievementSystem } from '@/lib/achievement-system';

const prisma = new PrismaClient();

// GET /api/lessons/[id]/notes - Get all notes for a lesson
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const notes = await prisma.lessonNote.findMany({
      where: {
        userId: user.id,
        lessonId: resolvedParams.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(notes);
  } catch (error) {
    console.error('Error fetching lesson notes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lesson notes' },
      { status: 500 }
    );
  }
}

// POST /api/lessons/[id]/notes - Create a new note
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { content, timestamp } = body;

    if (!content || content.trim() === '') {
      return NextResponse.json(
        { error: 'Note content is required' },
        { status: 400 }
      );
    }

    const resolvedParams = await params;
    const note = await prisma.lessonNote.create({
      data: {
        userId: user.id,
        lessonId: resolvedParams.id,
        content: content.trim(),
        timestamp: timestamp || null,
      },
    });

    // Trigger achievement checking for note creation
    let newAchievements: string[] = [];
    try {
      newAchievements = await achievementSystem.processUserActivity(
        user.id,
        {
          noteCreated: true,
          date: new Date(),
        }
      );
    } catch (error) {
      console.error('Error processing note achievement:', error);
    }

    return NextResponse.json({
      ...note,
      newAchievements,
    });
  } catch (error) {
    console.error('Error creating lesson note:', error);
    return NextResponse.json(
      { error: 'Failed to create lesson note' },
      { status: 500 }
    );
  }
}