import { type NextRequest, NextResponse } from "next/server"

// Simple semantic search using cosine similarity
function cosineSimilarity(a: number[], b: number[]): number {
  try {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0)
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0))
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0))

    if (magnitudeA === 0 || magnitudeB === 0) return 0
    return dotProduct / (magnitudeA * magnitudeB)
  } catch (error) {
    console.error("Error in cosine similarity:", error)
    return 0
  }
}

// Simple text embedding using TF-IDF-like approach
function createSimpleEmbedding(text: string): number[] {
  try {
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
  } catch (error) {
    console.error("Error creating embedding:", error)
    return new Array(100).fill(0)
  }
}

// Find relevant passages using semantic search
function findRelevantPassages(query: string, documentText: string, topK = 5): string[] {
  try {
    const queryEmbedding = createSimpleEmbedding(query)
    const sentences = documentText.split(/[.!?]+/).filter((s) => s.trim().length > 30)

    if (sentences.length === 0) {
      return [documentText.substring(0, 1000)]
    }

    const similarities = sentences.map((sentence) => ({
      sentence: sentence.trim(),
      similarity: cosineSimilarity(queryEmbedding, createSimpleEmbedding(sentence)),
    }))

    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK)
      .map((item) => item.sentence)
  } catch (error) {
    console.error("Error finding relevant passages:", error)
    return [documentText.substring(0, 1000)]
  }
}

// Generate chat response using Google Gemini API
async function generateChatResponse(message: string, documentText: string): Promise<string> {
  const geminiApiKey = process.env.GEMINI_API_KEY

  console.log("Gemini Chat API Key check:", {
    exists: !!geminiApiKey,
    length: geminiApiKey?.length || 0,
    prefix: geminiApiKey?.substring(0, 10) || "none",
  })

  // Find relevant context
  const relevantPassages = findRelevantPassages(message, documentText)
  const context = relevantPassages.join("\n\n")

  if (!geminiApiKey) {
    console.log("GEMINI_API_KEY not found, using fallback response")
    return `Based on the document context, I can see information related to your question about "${message}". However, the AI service is not configured. Please set up your GEMINI_API_KEY in the .env file to get detailed AI-powered responses.

Here's the relevant context from the document:
${context.substring(0, 500)}...`
  }

  try {
    console.log("Generating chat response with Gemini API...")

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

    console.log("Gemini Chat API response status:", response.status)

    if (response.ok) {
      const data = await response.json()
      const chatResponse = data.candidates?.[0]?.content?.parts?.[0]?.text
      if (chatResponse) {
        console.log("Successfully generated chat response using Gemini")
        return chatResponse
      } else {
        console.log("Gemini API returned empty chat response:", data)
      }
    } else {
      const errorText = await response.text()
      console.log(`Gemini Chat API failed: ${response.status} - ${errorText}`)
    }
  } catch (error) {
    console.log("Error with Gemini Chat API:", error)
  }

  // Fallback to OpenRouter if Gemini fails
  const openrouterApiKey = process.env.OPENROUTER_API_KEY
  if (openrouterApiKey) {
    try {
      console.log("Falling back to OpenRouter for chat...")
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
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
              content: `You are an expert legal assistant AI. Answer questions about the provided legal document accurately and professionally.

Document Context:
${context}`,
            },
            {
              role: "user",
              content: message,
            },
          ],
          max_tokens: 1000,
          temperature: 0.3,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const chatResponse = data.choices[0]?.message?.content
        if (chatResponse) {
          console.log("Successfully generated chat response using OpenRouter fallback")
          return chatResponse
        }
      }
    } catch (error) {
      console.log("OpenRouter chat fallback also failed:", error)
    }
  }

  // Final fallback - basic response with context
  console.log("All AI models failed for chat, returning context-based response")
  return `Based on your question about "${message}", here's what I found in the document:

${context}

Note: AI services are currently unavailable. This is a basic context-based response. For detailed AI analysis, please configure your API keys in the .env file.`
}

export async function POST(request: NextRequest) {
  console.log("Processing chat request...")

  try {
    const body = await request.json()
    const { message, documentText } = body

    if (!message || typeof message !== "string") {
      console.error("No message provided in chat request")
      return NextResponse.json({ error: "No message provided" }, { status: 400 })
    }

    if (!documentText || typeof documentText !== "string") {
      console.error("No document text provided in chat request")
      return NextResponse.json({ error: "No document context available" }, { status: 400 })
    }

    console.log(`Processing chat message: "${message.substring(0, 100)}..."`)
    console.log(`Document context length: ${documentText.length} characters`)

    // Generate chat response
    const response = await generateChatResponse(message, documentText)

    console.log("Chat response generated successfully")
    return NextResponse.json({
      response,
      model: "gemini-2.0-flash",
    })
  } catch (error) {
    console.error("Unexpected error processing chat:", error)

    // Return a safe fallback response instead of error
    return NextResponse.json({
      response:
        "I apologize, but I encountered an error while processing your question. Please try rephrasing your question or check if the document was uploaded correctly.",
      model: "fallback",
    })
  }
}
