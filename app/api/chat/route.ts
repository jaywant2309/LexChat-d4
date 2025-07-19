import { type NextRequest, NextResponse } from "next/server"

// Simple semantic search using cosine similarity
function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0)
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0))
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0))
  return dotProduct / (magnitudeA * magnitudeB)
}

// Simple text embedding using TF-IDF-like approach
function createSimpleEmbedding(text: string): number[] {
  const words = text.toLowerCase().match(/\b\w+\b/g) || []
  const wordFreq: { [key: string]: number } = {}

  words.forEach((word) => {
    wordFreq[word] = (wordFreq[word] || 0) + 1
  })

  // Create a simple 100-dimensional embedding
  const embedding = new Array(100).fill(0)
  Object.entries(wordFreq).forEach(([word, freq]) => {
    const hash = word.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0)
      return a & a
    }, 0)
    const index = Math.abs(hash) % 100
    embedding[index] += freq
  })

  return embedding
}

// Find relevant passages using semantic search
function findRelevantPassages(query: string, documentText: string, topK = 5): string[] {
  const queryEmbedding = createSimpleEmbedding(query)
  const sentences = documentText.split(/[.!?]+/).filter((s) => s.trim().length > 30)

  const similarities = sentences.map((sentence) => ({
    sentence: sentence.trim(),
    similarity: cosineSimilarity(queryEmbedding, createSimpleEmbedding(sentence)),
  }))

  return similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK)
    .map((item) => item.sentence)
}

export async function POST(request: NextRequest) {
  try {
    const { message, documentText } = await request.json()

    if (!message || !documentText) {
      return NextResponse.json({ error: "Message and document text are required" }, { status: 400 })
    }

    // Check for Gemini API key
    const geminiApiKey = process.env.GEMINI_API_KEY
    console.log("Gemini API Key check:", {
      exists: !!geminiApiKey,
      length: geminiApiKey?.length || 0,
      prefix: geminiApiKey?.substring(0, 10) || "none",
    })

    if (!geminiApiKey) {
      console.error("GEMINI_API_KEY environment variable is not set")
      return NextResponse.json({
        response:
          "I'm sorry, but the Gemini API key is not configured. Please check your .env file and ensure GEMINI_API_KEY is set correctly.",
      })
    }

    // Find relevant passages
    const relevantPassages = findRelevantPassages(message, documentText)
    const context = relevantPassages.join("\n\n")

    console.log("Relevant context found:", context.substring(0, 200) + "...")

    // Call Google Gemini API directly
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are LexChat, an expert legal assistant AI specializing in document analysis. You provide precise, professional, and insightful answers about legal documents.

INSTRUCTIONS:
- Answer questions based ONLY on the provided document context
- Be concise but comprehensive in your responses
- Use professional legal terminology when appropriate
- If information isn't in the document, clearly state this
- Provide specific references to document sections when possible
- Highlight key legal implications and considerations
- Structure your responses clearly with bullet points or numbered lists when helpful

DOCUMENT CONTEXT:
${context}

USER QUESTION: ${message}

Please provide a detailed, professional response based on the document context above.`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1000,
          },
        }),
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Gemini API error: ${response.status} - ${errorText}`)

      // Fallback to OpenRouter if available
      const openrouterApiKey = process.env.OPENROUTER_API_KEY
      if (openrouterApiKey) {
        console.log("Falling back to OpenRouter...")
        const fallbackResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openrouterApiKey}`,
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "LexChat Legal Assistant",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "openai/gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: `You are LexChat, an expert legal assistant AI. Answer questions about the provided legal document context professionally and accurately.

DOCUMENT CONTEXT:
${context}`,
              },
              {
                role: "user",
                content: message,
              },
            ],
            max_tokens: 800,
            temperature: 0.3,
          }),
        })

        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json()
          return NextResponse.json({
            response: fallbackData.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.",
            model: "gpt-4o-mini (fallback)",
          })
        }
      }

      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data = await response.json()
    const assistantResponse =
      data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't generate a response."

    return NextResponse.json({ response: assistantResponse, model: "gemini-2.0-flash" })
  } catch (error) {
    console.error("Error in chat:", error)
    return NextResponse.json(
      { response: "I'm sorry, there was an error processing your question. Please try again." },
      { status: 500 },
    )
  }
}
