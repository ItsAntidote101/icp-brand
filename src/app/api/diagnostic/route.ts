import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  )

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY ?? '',
  })

  const body = await req.json()
  const { questionnaireId, responses } = body

  const message = await anthropic.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `You are an ICP (Ideal Customer Profile) diagnostic specialist.
Analyze the following questionnaire responses and provide a structured ICP diagnostic report.

Responses: ${JSON.stringify(responses, null, 2)}

Return a JSON object with: summary, icp_segments, key_insights, recommendations.`,
      },
    ],
  })

  const diagnosisText = message.content[0].type === 'text' ? message.content[0].text : ''

  let diagnosis: unknown
  try {
    diagnosis = JSON.parse(diagnosisText)
  } catch {
    diagnosis = { raw: diagnosisText }
  }

  const { data, error } = await supabase
    .from('diagnostics')
    .insert([
      {
        questionnaire_id: questionnaireId,
        diagnosis,
        created_at: new Date().toISOString(),
      },
    ])
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ id: data.id, diagnosis }, { status: 201 })
}
