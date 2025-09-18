import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const states = await prisma.state.findMany({
      where: {
        isActive: true,
      },
      orderBy: [
        { type: 'asc' },
        { name: 'asc' },
      ],
    });

    return NextResponse.json(states);
  } catch (error) {
    console.error('Error fetching states:', error);
    return NextResponse.json(
      { error: 'Failed to fetch states' },
      { status: 500 }
    );
  }
}
