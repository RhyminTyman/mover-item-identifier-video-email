import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    console.log('Items autocomplete API called with query:', query);

    if (!query || query.length < 2) {
      return NextResponse.json([]);
    }

    const items = await prisma.itemDatabase.findMany({
      where: {
        name: {
          contains: query,
          mode: 'insensitive'
        },
        isActive: true
      },
      select: {
        id: true,
        name: true,
        cubicFeet: true,
        handlingCharge: true
      },
      orderBy: {
        name: 'asc'
      },
      take: 10 // Limit to 10 suggestions
    });

    console.log('Returning database items:', items.length);
    return NextResponse.json(items);
  } catch (error) {
    console.error('Error fetching item suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch item suggestions' },
      { status: 500 }
    );
  }
}
