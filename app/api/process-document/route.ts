import { type NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import path from "path"

// Enhanced NER function for legal entities with better patterns
function extractLegalEntities(text: string) {
  if (!text || typeof text !== "string") {
    return []
  }

  const entities = []

  try {
    // Enhanced Person/Party patterns
    const personPatterns = [
      /\b([A-Z][a-z]+ [A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\b/g, // First Middle Last
      /\b(Mr\.|Mrs\.|Ms\.|Dr\.|Prof\.) ([A-Z][a-z]+ [A-Z][a-z]+)\b/g, // Title First Last
      /\b([A-Z][A-Z]+)\s+([A-Z][a-z]+)\b/g, // FIRST Last
    ]

    // Enhanced Date patterns
    const datePatterns = [
      /\b(\d{1,2}\/\d{1,2}\/\d{4})\b/g, // MM/DD/YYYY
      /\b(\d{1,2}-\d{1,2}-\d{4})\b/g, // MM-DD-YYYY
      /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/g,
      /\b(\d{1,2}(?:st|nd|rd|th)?\s+(?:of\s+)?(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})\b/g,
    ]

    // Enhanced Money patterns
    const moneyPatterns = [
      /\$[\d,]+\.?\d*/g, // $1,000.00
      /\b(\d+(?:,\d{3})*(?:\.\d{2})?\s*dollars?)\b/gi,
      /\b(USD\s*\$?[\d,]+\.?\d*)\b/gi,
      /\b(\d+(?:,\d{3})*(?:\.\d{2})?\s*(?:USD|usd))\b/gi,
    ]

    // Enhanced Organization patterns
    const orgPatterns = [
      /\b([A-Z][a-zA-Z\s&]+ (?:Inc\.|LLC|Corp\.|Corporation|Company|Co\.|Ltd\.|Limited|LLP|LP))\b/g,
      /\b([A-Z][a-zA-Z\s&]+ (?:Bank|Trust|Insurance|Holdings|Group|Partners|Associates|Firm))\b/g,
      /\b(The [A-Z][a-zA-Z\s&]+ (?:Inc\.|LLC|Corp\.|Corporation|Company|Co\.))\b/g,
    ]

    // Legal-specific patterns
    const legalPatterns = [
      /\b(Contract|Agreement|License|Lease|Deed|Will|Testament|Covenant|Indenture|Mortgage|Lien)\b/gi,
      /\b(Plaintiff|Defendant|Petitioner|Respondent|Appellant|Appellee)\b/gi,
      /\b(Court|Tribunal|Judge|Justice|Magistrate|Clerk)\b/gi,
    ]

    // Extract persons
    personPatterns.forEach((pattern) => {
      let match
      const regex = new RegExp(pattern.source, pattern.flags)
      while ((match = regex.exec(text)) !== null) {
        const fullMatch = match[0].trim()
        if (fullMatch.length > 3 && !fullMatch.match(/^\d/)) {
          entities.push({
            text: fullMatch,
            label: "PERSON",
            start: match.index,
            end: match.index + fullMatch.length,
          })
        }
      }
    })

    // Extract dates
    datePatterns.forEach((pattern) => {
      let match
      const regex = new RegExp(pattern.source, pattern.flags)
      while ((match = regex.exec(text)) !== null) {
        entities.push({
          text: match[0],
          label: "DATE",
          start: match.index,
          end: match.index + match[0].length,
        })
      }
    })

    // Extract money
    moneyPatterns.forEach((pattern) => {
      let match
      const regex = new RegExp(pattern.source, pattern.flags)
      while ((match = regex.exec(text)) !== null) {
        entities.push({
          text: match[0],
          label: "MONEY",
          start: match.index,
          end: match.index + match[0].length,
        })
      }
    })

    // Extract organizations
    orgPatterns.forEach((pattern) => {
      let match
      const regex = new RegExp(pattern.source, pattern.flags)
      while ((match = regex.exec(text)) !== null) {
        entities.push({
          text: match[0],
          label: "ORGANIZATION",
          start: match.index,
          end: match.index + match[0].length,
        })
      }
    })

    // Extract legal terms
    legalPatterns.forEach((pattern) => {
      let match
      const regex = new RegExp(pattern.source, pattern.flags)
      while ((match = regex.exec(text)) !== null) {
        entities.push({
          text: match[0],
          label: "LEGAL_TERM",
          start: match.index,
          end: match.index + match[0].length,
        })
      }
    })

    // Remove duplicates and sort by position
    const uniqueEntities = entities
      .filter(
        (entity, index, self) => index === self.findIndex((e) => e.text === entity.text && e.label === entity.label),
      )
      .sort((a, b) => a.start - b.start)

    return uniqueEntities
  } catch (error) {
    console.error("Error in entity extraction:", error)
    return []
  }
}

// Generate suggested questions based on document content and entities
function generateSuggestedQuestions(text: string, entities: any[]): string[] {
  const questions = []

  try {
    // Basic questions for all documents
    questions.push("What is the main purpose of this document?")
    questions.push("What are the key terms and conditions?")

    // Questions based on entities
    const persons = entities.filter((e) => e.label === "PERSON")
    const organizations = entities.filter((e) => e.label === "ORGANIZATION")
    const dates = entities.filter((e) => e.label === "DATE")
    const amounts = entities.filter((e) => e.label === "MONEY")

    if (persons.length > 0) {
      questions.push("Who are the main parties involved in this document?")
      questions.push(`What are the responsibilities of ${persons[0].text}?`)
    }

    if (organizations.length > 0) {
      questions.push("What organizations are mentioned in this document?")
      questions.push(`What is the role of ${organizations[0].text}?`)
    }

    if (dates.length > 0) {
      questions.push("What are the important dates and deadlines?")
      questions.push("When does this agreement take effect?")
    }

    if (amounts.length > 0) {
      questions.push("What are the financial obligations mentioned?")
      questions.push("What payment terms are specified?")
    }

    // Document type specific questions
    const textLower = text.toLowerCase()

    if (textLower.includes("contract") || textLower.includes("agreement")) {
      questions.push("What happens if either party breaches this contract?")
      questions.push("How can this agreement be terminated?")
    }

    if (textLower.includes("lease") || textLower.includes("rental")) {
      questions.push("What are the lease terms and rental amount?")
      questions.push("What are the tenant's and landlord's responsibilities?")
    }

    if (textLower.includes("employment") || textLower.includes("job")) {
      questions.push("What are the employment terms and benefits?")
      questions.push("What are the grounds for termination?")
    }

    if (textLower.includes("privacy") || textLower.includes("data")) {
      questions.push("How is personal data collected and used?")
      questions.push("What are the privacy rights and protections?")
    }

    if (textLower.includes("liability") || textLower.includes("insurance")) {
      questions.push("What are the liability limitations?")
      questions.push("What insurance requirements are specified?")
    }

    // Return unique questions, limited to 6
    return [...new Set(questions)].slice(0, 6)
  } catch (error) {
    console.error("Error generating suggested questions:", error)
    return [
      "What is the main purpose of this document?",
      "Who are the parties involved?",
      "What are the key terms and conditions?",
      "What are the important dates?",
      "What are the financial obligations?",
      "What are the legal implications?",
    ]
  }
}

// Generate comprehensive summary using Google Gemini API
async function generateSummary(text: string): Promise<string> {
  const geminiApiKey = process.env.GEMINI_API_KEY

  console.log("Gemini Summary API Key check:", {
    exists: !!geminiApiKey,
    length: geminiApiKey?.length || 0,
    prefix: geminiApiKey?.substring(0, 10) || "none",
  })

  if (!geminiApiKey) {
    console.log("GEMINI_API_KEY not found, generating basic summary")
    return generateBasicSummary(text)
  }

  try {
    console.log("Generating summary with Gemini API...")

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
                  text: `You are an expert legal document analyst. Provide comprehensive, professional summaries of legal documents that include:

1. Document Type & Purpose
2. Key Parties Involved
3. Main Terms & Conditions
4. Important Dates & Deadlines
5. Financial Obligations
6. Legal Implications
7. Risk Factors

Structure your response clearly and use professional legal terminology.

Please provide a comprehensive executive summary of this legal document:

${text.substring(0, 6000)}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 800,
          },
        }),
      },
    )

    console.log("Gemini API response status:", response.status)

    if (response.ok) {
      const data = await response.json()
      const summary = data.candidates?.[0]?.content?.parts?.[0]?.text
      if (summary) {
        console.log("Successfully generated summary using Gemini")
        return summary
      } else {
        console.log("Gemini API returned empty summary:", data)
      }
    } else {
      const errorText = await response.text()
      console.log(`Gemini API failed: ${response.status} - ${errorText}`)
    }
  } catch (error) {
    console.log("Error with Gemini API:", error)
  }

  // Fallback to OpenRouter if Gemini fails
  const openrouterApiKey = process.env.OPENROUTER_API_KEY
  if (openrouterApiKey) {
    try {
      console.log("Falling back to OpenRouter for summary...")
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
              content: `You are an expert legal document analyst. Provide comprehensive, professional summaries of legal documents.`,
            },
            {
              role: "user",
              content: `Please provide a comprehensive executive summary of this legal document:\n\n${text.substring(0, 6000)}`,
            },
          ],
          max_tokens: 800,
          temperature: 0.2,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const summary = data.choices[0]?.message?.content
        if (summary) {
          console.log("Successfully generated summary using OpenRouter fallback")
          return summary
        }
      }
    } catch (error) {
      console.log("OpenRouter fallback also failed:", error)
    }
  }

  // If all AI models fail, return a basic summary
  console.log("All AI models failed, generating basic summary")
  return generateBasicSummary(text)
}

// Fallback summary generation without AI
function generateBasicSummary(text: string): string {
  try {
    const words = text.split(/\s+/)
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 10)

    // Extract key information
    const entities = extractLegalEntities(text)
    const persons = entities.filter((e) => e.label === "PERSON").map((e) => e.text)
    const organizations = entities.filter((e) => e.label === "ORGANIZATION").map((e) => e.text)
    const dates = entities.filter((e) => e.label === "DATE").map((e) => e.text)
    const amounts = entities.filter((e) => e.label === "MONEY").map((e) => e.text)

    let summary = "DOCUMENT ANALYSIS SUMMARY\n\n"

    summary += `Document Length: ${words.length} words, ${sentences.length} sentences\n\n`

    if (persons.length > 0) {
      summary += `Key Individuals: ${persons.slice(0, 5).join(", ")}\n\n`
    }

    if (organizations.length > 0) {
      summary += `Organizations: ${organizations.slice(0, 5).join(", ")}\n\n`
    }

    if (dates.length > 0) {
      summary += `Important Dates: ${dates.slice(0, 5).join(", ")}\n\n`
    }

    if (amounts.length > 0) {
      summary += `Financial Amounts: ${amounts.slice(0, 5).join(", ")}\n\n`
    }

    // Add first few sentences as content preview
    summary += `Content Preview: ${sentences.slice(0, 3).join(". ").substring(0, 500)}...`

    return summary
  } catch (error) {
    console.error("Error generating basic summary:", error)
    return "Document analysis completed. Unable to generate detailed summary due to processing error."
  }
}

// Enhanced PDF text extraction with better patterns
function extractTextFromPDF(buffer: Buffer): string {
  try {
    const pdfString = buffer.toString("binary")
    let extractedText = ""

    // Method 1: Extract text from stream objects with better parsing
    const streamRegex = /stream\s*([\s\S]*?)\s*endstream/g
    let streamMatch
    while ((streamMatch = streamRegex.exec(pdfString)) !== null) {
      const streamContent = streamMatch[1]

      // Look for text content in parentheses
      const textMatches = streamContent.match(/$$(.*?)$$/g)
      if (textMatches) {
        textMatches.forEach((match) => {
          const text = match.slice(1, -1) // Remove parentheses
          if (text.length > 1 && /[a-zA-Z]/.test(text)) {
            extractedText += text + " "
          }
        })
      }

      // Look for text in brackets
      const bracketMatches = streamContent.match(/\[(.*?)\]/g)
      if (bracketMatches) {
        bracketMatches.forEach((match) => {
          const content = match.slice(1, -1)
          const textParts = content.match(/$$(.*?)$$/g)
          if (textParts) {
            textParts.forEach((part) => {
              const text = part.slice(1, -1)
              if (text.length > 1) {
                extractedText += text + " "
              }
            })
          }
        })
      }
    }

    // Method 2: Extract text from BT/ET blocks with improved parsing
    const textObjectRegex = /BT\s*([\s\S]*?)\s*ET/g
    let textMatch
    while ((textMatch = textObjectRegex.exec(pdfString)) !== null) {
      const textContent = textMatch[1]

      // Extract text from Tj operators
      const tjMatches = textContent.match(/$$(.*?)$$\s*Tj/g)
      if (tjMatches) {
        tjMatches.forEach((match) => {
          const text = match.match(/$$(.*?)$$/)?.[1]
          if (text && text.length > 1) {
            extractedText += text + " "
          }
        })
      }

      // Extract text from TJ operators (array format)
      const arrayMatches = textContent.match(/\[(.*?)\]\s*TJ/g)
      if (arrayMatches) {
        arrayMatches.forEach((match) => {
          const arrayContent = match.match(/\[(.*?)\]/)?.[1]
          if (arrayContent) {
            const textParts = arrayContent.match(/$$(.*?)$$/g)
            if (textParts) {
              textParts.forEach((part) => {
                const text = part.slice(1, -1)
                if (text.length > 1) {
                  extractedText += text + " "
                }
              })
            }
          }
        })
      }
    }

    // Method 3: Enhanced readable text extraction
    if (extractedText.length < 100) {
      const readableTextRegex = /[A-Za-z][A-Za-z0-9\s.,;:!?'"()-]{15,}/g
      const readableMatches = pdfString.match(readableTextRegex)
      if (readableMatches) {
        readableMatches.forEach((text) => {
          if (text.trim().length > 15 && !text.includes("\x00") && !text.includes("obj")) {
            extractedText += text.trim() + " "
          }
        })
      }
    }

    // Enhanced text cleaning
    extractedText = extractedText
      .replace(/\s+/g, " ") // Replace multiple spaces
      .replace(/[^\x20-\x7E\s]/g, "") // Remove non-printable characters
      .replace(/\b(obj|endobj|stream|endstream|xref|trailer)\b/gi, "") // Remove PDF keywords
      .trim()

    return extractedText
  } catch (error) {
    console.error("Enhanced PDF extraction error:", error)
    return ""
  }
}

// Dynamic import function for Word processing
async function processWord(buffer: Buffer): Promise<string> {
  try {
    const mammoth = await import("mammoth")
    const result = await mammoth.extractRawText({ buffer })
    return result.value || ""
  } catch (error) {
    console.error("Word processing error:", error)
    // Return empty string instead of throwing error
    return ""
  }
}

// Dynamic import function for OCR processing
async function processImage(buffer: Buffer): Promise<string> {
  try {
    const Tesseract = await import("tesseract.js")
    const {
      data: { text },
    } = await Tesseract.recognize(buffer, "eng", {
      logger: (m: any) => console.log("OCR:", m),
    })
    return text || ""
  } catch (error) {
    console.error("OCR processing error:", error)
    // Return empty string instead of throwing error
    return ""
  }
}

export async function POST(request: NextRequest) {
  console.log("Processing document request...")

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      console.error("No file provided in request")
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    console.log(`Processing file: ${file.name}, type: ${file.type}, size: ${file.size}`)

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Maximum size is 10MB." }, { status: 400 })
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), "uploads")
    if (!existsSync(uploadsDir)) {
      console.log("Creating uploads directory...")
      await mkdir(uploadsDir, { recursive: true })
    }

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filePath = path.join(uploadsDir, file.name)
    await writeFile(filePath, buffer)
    console.log(`File saved to: ${filePath}`)

    let extractedText = ""
    let processingMethod = ""

    // Extract text based on file type
    try {
      if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
        console.log("Processing as PDF...")
        processingMethod = "Enhanced PDF Analysis"
        extractedText = extractTextFromPDF(buffer)
        console.log(`Extracted ${extractedText.length} characters from PDF`)

        if (extractedText.length < 50) {
          console.log("Trying alternative PDF extraction...")
          const asciiText = buffer.toString("ascii")
          const readableText = asciiText.match(/[a-zA-Z][a-zA-Z0-9\s.,;:!?'"()-]{10,}/g)
          if (readableText) {
            extractedText = readableText.join(" ").replace(/\s+/g, " ").trim()
            processingMethod = "PDF ASCII Extraction"
          }
        }
      } else if (file.type.includes("word") || file.name.endsWith(".docx") || file.name.endsWith(".doc")) {
        console.log("Processing as Word document...")
        processingMethod = "Word Document Analysis"
        extractedText = await processWord(buffer)
        console.log(`Extracted ${extractedText.length} characters from Word document`)
      } else if (file.type.startsWith("image/")) {
        console.log("Processing as image with OCR...")
        processingMethod = "OCR Text Recognition"
        extractedText = await processImage(buffer)
        console.log(`Extracted ${extractedText.length} characters from image`)
      } else if (file.type === "text/plain" || file.name.toLowerCase().endsWith(".txt")) {
        console.log("Processing as plain text...")
        processingMethod = "Plain Text Analysis"
        extractedText = buffer.toString("utf-8")
        console.log(`Extracted ${extractedText.length} characters from text file`)
      } else {
        console.error(`Unsupported file type: ${file.type}`)
        return NextResponse.json(
          {
            error: `Unsupported file type: ${file.type}. Supported formats: PDF, Word (.docx, .doc), images, and text files.`,
          },
          { status: 400 },
        )
      }
    } catch (processingError) {
      console.error(`Error processing ${processingMethod}:`, processingError)
      // Continue with empty text instead of failing
      extractedText = ""
      processingMethod = "Processing Failed - Using Fallback"
    }

    // If no text extracted, create a basic analysis
    if (!extractedText || extractedText.trim().length === 0) {
      console.log("No text extracted, creating basic file analysis")
      extractedText = `File Analysis: ${file.name}
File Type: ${file.type}
File Size: ${file.size} bytes
Processing Method: ${processingMethod}

This file could not be processed for text extraction. It may be:
- An image-only PDF or scanned document
- A corrupted file
- An unsupported format variant
- A file requiring specialized processing

Please try:
1. Converting to a text-based PDF
2. Using a different file format
3. Ensuring the file is not corrupted`
    }

    console.log(`Successfully processed file (${extractedText.length} characters)`)

    // Extract entities with enhanced patterns
    console.log("Extracting legal entities...")
    const entities = extractLegalEntities(extractedText)
    console.log(`Extracted ${entities.length} entities`)

    // Generate suggested questions
    console.log("Generating suggested questions...")
    const suggestedQuestions = generateSuggestedQuestions(extractedText, entities)
    console.log(`Generated ${suggestedQuestions.length} suggested questions`)

    // Generate comprehensive summary
    console.log("Generating comprehensive summary...")
    const summary = await generateSummary(extractedText)
    console.log("Summary generated successfully")

    const result = {
      entities,
      summary,
      fullText: extractedText,
      processingMethod,
      suggestedQuestions,
      fileInfo: {
        name: file.name,
        type: file.type,
        size: file.size,
        textLength: extractedText.length,
      },
    }

    console.log("Document processing completed successfully")
    return NextResponse.json(result)
  } catch (error) {
    console.error("Unexpected error processing document:", error)

    // Return a safe fallback response instead of error
    return NextResponse.json({
      entities: [],
      summary:
        "Document processing encountered an error. The file may be corrupted or in an unsupported format. Please try uploading a different file or contact support if the issue persists.",
      fullText: "Error processing document",
      processingMethod: "Error Recovery",
      suggestedQuestions: [
        "What file formats are supported?",
        "How can I convert my document to a supported format?",
        "What should I do if my file won't process?",
      ],
      fileInfo: {
        name: "Unknown",
        type: "Unknown",
        size: 0,
        textLength: 0,
      },
    })
  }
}
