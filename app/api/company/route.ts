import { NextResponse } from 'next/server'
import { saveCompany, getCompanyByUserId, updateCompany } from '@/lib/db/queries'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
  }

  try {
    const company = await getCompanyByUserId(userId)
    return NextResponse.json(company)
  } catch (error) {
    console.error('Failed to get company:', error)
    return NextResponse.json({ error: 'Failed to get company' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, description, useCase, userId } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const result = await saveCompany({ name, description, useCase, userId })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to save company:', error)
    return NextResponse.json({ error: 'Failed to save company' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, name, description, useCase } = body

    if (!id) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 })
    }

    const result = await updateCompany({ id, name, description, useCase })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to update company:', error)
    return NextResponse.json({ error: 'Failed to update company' }, { status: 500 })
  }
} 