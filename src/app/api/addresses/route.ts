import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const addresses = await prisma.address.findMany({
      where: {
        userId: userId,
        isActive: true,
      },
      include: {
        state: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(addresses);
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch addresses' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { street1, street2, city, stateId, zipCode, country = 'US' } = body;

    // Validate required fields
    if (!street1 || !city || !stateId || !zipCode) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify state exists
    const state = await prisma.state.findUnique({
      where: { id: stateId },
    });

    if (!state) {
      return NextResponse.json(
        { error: 'Invalid state' },
        { status: 400 }
      );
    }

    const address = await prisma.address.create({
      data: {
        street1,
        street2,
        city,
        stateId,
        zipCode,
        country,
        userId,
      },
      include: {
        state: true,
      },
    });

    return NextResponse.json(address);
  } catch (error) {
    console.error('Error creating address:', error);
    return NextResponse.json(
      { error: 'Failed to create address' },
      { status: 500 }
    );
  }
}
