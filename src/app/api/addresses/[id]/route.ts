import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const address = await prisma.address.findFirst({
      where: {
        id: id,
        userId: userId,
        isActive: true,
      },
      include: {
        state: true,
      },
    });

    if (!address) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    return NextResponse.json(address);
  } catch (error) {
    console.error('Error fetching address:', error);
    return NextResponse.json(
      { error: 'Failed to fetch address' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
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

    const address = await prisma.address.updateMany({
      where: {
        id: id,
        userId: userId,
      },
      data: {
        street1,
        street2,
        city,
        stateId,
        zipCode,
        country,
      },
    });

    if (address.count === 0) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    // Fetch updated address
    const updatedAddress = await prisma.address.findUnique({
      where: { id: id },
      include: {
        state: true,
      },
    });

    return NextResponse.json(updatedAddress);
  } catch (error) {
    console.error('Error updating address:', error);
    return NextResponse.json(
      { error: 'Failed to update address' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const address = await prisma.address.updateMany({
      where: {
        id: id,
        userId: userId,
      },
      data: {
        isActive: false,
      },
    });

    if (address.count === 0) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting address:', error);
    return NextResponse.json(
      { error: 'Failed to delete address' },
      { status: 500 }
    );
  }
}
