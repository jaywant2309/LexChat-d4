"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Upload,
  FileText,
  MessageSquare,
  Users,
  Calendar,
  DollarSign,
  FileCheck,
  Loader2,
  Brain,
  Sparkles,
  Building,
  Scale,
  Send,
  Bot,
  User,
  Shield,
  Zap,
  Star,
  CheckCircle,
  HelpCircle,
  Lightbulb,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface ExtractedEntity {
  text: string
  label: string
  start: number
  end: number
  confidence?: number
}

interface DocumentAnalysis {
  entities: ExtractedEntity[]
  summary: string
  fullText: string
  processingMethod: string
  fileInfo: {
    name: string
    type: string
    size: number
    textLength: number
  }
  suggestedQuestions?: string[]
}

interface ChatMessage {
  role: "user" | "assistant"
  content: string
  timestamp: Date
  isTyping?: boolean
}

export default function LexChatApp() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState("")
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("entities")

  const simulateProgress = () => {
    setProcessingProgress(0)
    const interval = setInterval(() => {
      setProcessingProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval)
          return prev
        }
        return prev + Math.random() * 15
      })
    }, 500)
    return interval
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    console.log("File selected:", file.name, file.type, file.size)

    setUploadedFile(file)
    setIsProcessing(true)
    setAnalysis(null)
    setChatMessages([])

    const progressInterval = simulateProgress()

    try {
      const formData = new FormData()
      formData.append("file", file)

      console.log("Sending file to API...")
      const response = await fetch("/api/process-document", {
        method: "POST",
        body: formData,
      })

      console.log("API response status:", response.status)
      console.log("API response headers:", Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        let errorMessage = `Server error: ${response.status} ${response.statusText}`

        try {
          // Try to parse as JSON first
          const contentType = response.headers.get("content-type")
          if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json()
            errorMessage = errorData.error || errorMessage
            console.error("API JSON error:", errorData)
          } else {
            // If not JSON, get text response
            const errorText = await response.text()
            errorMessage = errorText.substring(0, 500) || errorMessage
            console.error("API text error:", errorText)
          }
        } catch (parseError) {
          console.error("Error parsing error response:", parseError)
          // Use the default error message
        }

        throw new Error(errorMessage)
      }

      // Ensure response is JSON
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const responseText = await response.text()
        console.error("Expected JSON response but got:", contentType, responseText.substring(0, 500))
        throw new Error("Server returned invalid response format. Please check server logs.")
      }

      const result = await response.json()
      console.log("Processing result:", result)

      setProcessingProgress(100)
      setAnalysis(result)
      setActiveTab("summary")

      toast({
        title: "✨ Document processed successfully!",
        description: `Extracted ${result.entities.length} entities using ${result.processingMethod} processing.`,
      })
    } catch (error) {
      console.error("Error processing document:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"

      toast({
        title: "❌ Error processing document",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      clearInterval(progressInterval)
      setIsProcessing(false)
      setProcessingProgress(0)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".bmp", ".tiff"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/msword": [".doc"],
      "text/plain": [".txt"],
    },
    multiple: false,
  })

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim() || !analysis) return

    const userMessage: ChatMessage = {
      role: "user",
      content: chatInput,
      timestamp: new Date(),
    }

    setChatMessages((prev) => [...prev, userMessage])
    setChatInput("")
    setIsChatLoading(true)

    // Add typing indicator
    const typingMessage: ChatMessage = {
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isTyping: true,
    }
    setChatMessages((prev) => [...prev, typingMessage])

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: chatInput,
          documentText: analysis.fullText,
        }),
      })

      if (!response.ok) {
        let errorMessage = `Chat service error: ${response.status}`

        try {
          const contentType = response.headers.get("content-type")
          if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json()
            errorMessage = errorData.error || errorMessage
          } else {
            const errorText = await response.text()
            errorMessage = errorText.substring(0, 500) || errorMessage
          }
        } catch (parseError) {
          console.error("Error parsing chat error response:", parseError)
        }

        throw new Error(errorMessage)
      }

      const result = await response.json()

      // Remove typing indicator and add real response
      setChatMessages((prev) => {
        const withoutTyping = prev.filter((msg) => !msg.isTyping)
        return [
          ...withoutTyping,
          {
            role: "assistant",
            content: result.response,
            timestamp: new Date(),
          },
        ]
      })
    } catch (error) {
      console.error("Error in chat:", error)
      setChatMessages((prev) => prev.filter((msg) => !msg.isTyping))

      const errorMessage = error instanceof Error ? error.message : "Failed to get response"
      toast({
        title: "Chat error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsChatLoading(false)
    }
  }

  const handleSuggestedQuestion = (question: string) => {
    setChatInput(question)
  }

  const getEntityIcon = (label: string) => {
    switch (label.toLowerCase()) {
      case "person":
        return <User className="h-4 w-4" />
      case "organization":
        return <Building className="h-4 w-4" />
      case "date":
        return <Calendar className="h-4 w-4" />
      case "money":
        return <DollarSign className="h-4 w-4" />
      default:
        return <FileCheck className="h-4 w-4" />
    }
  }

  const getEntityColor = (label: string) => {
    switch (label.toLowerCase()) {
      case "person":
        return "bg-blue-50 text-blue-700 border-blue-200"
      case "date":
        return "bg-green-50 text-green-700 border-green-200"
      case "money":
        return "bg-yellow-50 text-yellow-700 border-yellow-200"
      case "organization":
        return "bg-purple-50 text-purple-700 border-purple-200"
      default:
        return "bg-gray-50 text-gray-700 border-gray-200"
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-40">
        <svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <defs>
            <pattern id="dot-pattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
              <circle cx="30" cy="30" r="2" fill="#9C92AC" fillOpacity="0.05" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dot-pattern)" />
        </svg>
      </div>

      {/* Header */}
      <div className="bg-white/90 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="p-3 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-lg">
                  <Scale className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
                  LexChat
                </h1>
                <p className="text-sm text-slate-600 font-medium">Smart Legal Assistant</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-sm text-slate-600 bg-white/60 px-4 py-2 rounded-full border border-slate-200">
                <Brain className="h-4 w-4 text-blue-600" />
                <span className="font-medium">Powered by Gemini AI</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-full border border-green-200">
                <Shield className="h-4 w-4" />
                <span className="font-medium">Secure</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 px-6 py-3 rounded-full text-sm font-semibold mb-6 border border-blue-200 shadow-sm">
            <Sparkles className="h-4 w-4" />
            <span>Advanced AI Legal Analysis</span>
            <Star className="h-4 w-4 text-yellow-500 fill-current" />
          </div>
          <h2 className="text-5xl font-bold text-slate-900 mb-4 leading-tight">
            Intelligent Legal Document
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent block">
              Analysis & Insights
            </span>
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Upload legal documents for AI-powered analysis, entity extraction, and intelligent Q&A using Google's
            advanced Gemini AI
          </p>

          {/* Feature Pills */}
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            {[
              { icon: Zap, text: "Lightning Fast", color: "yellow" },
              { icon: Shield, text: "Secure Processing", color: "green" },
              { icon: Brain, text: "AI-Powered", color: "blue" },
              { icon: CheckCircle, text: "99% Accurate", color: "purple" },
            ].map((feature, index) => (
              <div
                key={index}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
                  ${feature.color === "yellow" ? "bg-yellow-50 text-yellow-700 border border-yellow-200" : ""}
                  ${feature.color === "green" ? "bg-green-50 text-green-700 border border-green-200" : ""}
                  ${feature.color === "blue" ? "bg-blue-50 text-blue-700 border border-blue-200" : ""}
                  ${feature.color === "purple" ? "bg-purple-50 text-purple-700 border border-purple-200" : ""}
                `}
              >
                <feature.icon className="h-4 w-4" />
                {feature.text}
              </div>
            ))}
          </div>
        </div>

        {/* File Upload Area */}
        <Card className="mb-8 border-0 shadow-2xl bg-white/80 backdrop-blur-sm overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 p-1">
            <CardHeader className="pb-4 bg-white/90 rounded-t-lg">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Upload className="h-6 w-6 text-blue-600" />
                </div>
                Document Upload
              </CardTitle>
              <CardDescription className="text-base text-slate-600">
                Drag & drop or click to upload PDF, Word (.docx, .doc), image, or text files for AI analysis
              </CardDescription>
            </CardHeader>
          </div>
          <CardContent className="p-8 bg-white/90">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all duration-300 relative overflow-hidden ${
                isDragActive
                  ? "border-blue-400 bg-gradient-to-br from-blue-50 to-indigo-50 scale-[1.02] shadow-lg"
                  : "border-slate-300 hover:border-blue-400 hover:bg-gradient-to-br hover:from-slate-50 hover:to-blue-50"
              }`}
            >
              <input {...getInputProps()} />
              {isProcessing ? (
                <div className="flex flex-col items-center gap-8">
                  <div className="relative">
                    <div className="w-20 h-20 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Brain className="h-8 w-8 text-blue-600 animate-pulse" />
                    </div>
                  </div>
                  <div className="space-y-4 w-full max-w-md">
                    <p className="text-2xl font-bold text-slate-900">Processing document...</p>
                    <Progress value={processingProgress} className="h-3 bg-slate-200" />
                    <p className="text-base text-slate-600">
                      Extracting text, analyzing entities, and generating AI insights
                    </p>
                  </div>
                </div>
              ) : uploadedFile ? (
                <div className="flex flex-col items-center gap-6">
                  <div className="p-6 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl shadow-lg">
                    <FileText className="h-16 w-16 text-green-600" />
                  </div>
                  <div className="space-y-3">
                    <p className="text-2xl font-bold text-slate-900">{uploadedFile.name}</p>
                    <p className="text-base text-slate-600">
                      {formatFileSize(uploadedFile.size)} • Ready for AI analysis
                    </p>
                  </div>
                  <p className="text-sm text-slate-500 bg-slate-100 px-4 py-2 rounded-full">
                    Drop another file to replace
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-8">
                  <div className="relative">
                    <div className="p-6 bg-gradient-to-br from-slate-100 to-blue-100 rounded-2xl shadow-lg">
                      <Upload className="h-16 w-16 text-slate-500" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <Sparkles className="h-3 w-3 text-white" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <p className="text-2xl font-bold text-slate-900">
                      {isDragActive ? "Drop the file here..." : "Upload your legal document"}
                    </p>
                    <p className="text-lg text-slate-600 max-w-md">
                      Supports PDF, Word (.docx, .doc), images, and text files
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      <span>Max 10MB</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      <span>Secure processing</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Brain className="h-4 w-4" />
                      <span>AI-powered analysis</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Analysis Results */}
        {analysis && (
          <div className="space-y-8">
            {/* File Info Card */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="p-4 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl">
                      <FileText className="h-8 w-8 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">{analysis.fileInfo.name}</h3>
                      <p className="text-base text-slate-600 mt-1">
                        {formatFileSize(analysis.fileInfo.size)} • {analysis.processingMethod} •{" "}
                        {analysis.fileInfo.textLength.toLocaleString()} characters
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 text-sm font-semibold">
                    ✓ Processed
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
              <TabsList className="grid w-full grid-cols-3 bg-white/80 backdrop-blur-sm p-2 h-16 shadow-lg border-0">
                <TabsTrigger
                  value="entities"
                  className="flex items-center gap-3 text-base data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-600 rounded-xl"
                >
                  <Users className="h-5 w-5" />
                  Entities
                </TabsTrigger>
                <TabsTrigger
                  value="summary"
                  className="flex items-center gap-3 text-base data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-600 rounded-xl"
                >
                  <FileText className="h-5 w-5" />
                  Summary
                </TabsTrigger>
                <TabsTrigger
                  value="chat"
                  className="flex items-center gap-3 text-base data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-600 rounded-xl"
                >
                  <MessageSquare className="h-5 w-5" />
                  Q&A Chat
                </TabsTrigger>
              </TabsList>

              <TabsContent value="entities">
                <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
                  <CardHeader className="pb-6">
                    <CardTitle className="flex items-center gap-3 text-2xl">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Users className="h-6 w-6 text-blue-600" />
                      </div>
                      Legal Entities ({analysis.entities.length})
                    </CardTitle>
                    <CardDescription className="text-base">
                      Automatically extracted parties, dates, amounts, and other legal entities using AI
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {analysis.entities.length > 0 ? (
                      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {analysis.entities.map((entity, index) => (
                          <div
                            key={index}
                            className="group p-6 border border-slate-200 rounded-2xl hover:shadow-lg transition-all duration-300 bg-white/60 hover:bg-white/80 hover:scale-[1.02]"
                          >
                            <div className="flex items-start gap-4">
                              <div className="mt-1 p-3 bg-slate-100 rounded-xl group-hover:bg-slate-200 transition-colors">
                                {getEntityIcon(entity.label)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-slate-900 truncate text-base">{entity.text}</p>
                                <Badge
                                  variant="outline"
                                  className={`mt-3 ${getEntityColor(entity.label)} border font-medium`}
                                >
                                  {entity.label}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-16">
                        <div className="p-6 bg-slate-100 rounded-2xl w-fit mx-auto mb-6">
                          <FileCheck className="h-16 w-16 text-slate-400 mx-auto" />
                        </div>
                        <p className="text-lg text-slate-600">No entities extracted from this document.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="summary">
                <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
                  <CardHeader className="pb-6">
                    <CardTitle className="flex items-center gap-3 text-2xl">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Brain className="h-6 w-6 text-blue-600" />
                      </div>
                      Executive Summary
                    </CardTitle>
                    <CardDescription className="text-base">
                      AI-generated summary of the document's key points and legal implications
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="prose max-w-none">
                      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8 rounded-2xl border border-blue-100 shadow-inner">
                        <p className="text-slate-800 leading-relaxed whitespace-pre-wrap text-base">
                          {analysis.summary}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="chat">
                <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
                  <CardHeader className="pb-6">
                    <CardTitle className="flex items-center gap-3 text-2xl">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <MessageSquare className="h-6 w-6 text-blue-600" />
                      </div>
                      Document Q&A
                    </CardTitle>
                    <CardDescription className="text-base">
                      Ask questions about the document and get AI-powered answers from Gemini
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Suggested Questions */}
                      {analysis.suggestedQuestions && analysis.suggestedQuestions.length > 0 && (
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-200">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <Lightbulb className="h-5 w-5 text-blue-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900">Suggested Questions</h3>
                          </div>
                          <div className="grid gap-3 md:grid-cols-2">
                            {analysis.suggestedQuestions.map((question, index) => (
                              <button
                                key={index}
                                onClick={() => handleSuggestedQuestion(question)}
                                className="text-left p-4 bg-white/80 hover:bg-white border border-blue-200 rounded-xl transition-all duration-200 hover:shadow-md hover:scale-[1.02] group"
                              >
                                <div className="flex items-start gap-3">
                                  <HelpCircle className="h-4 w-4 text-blue-600 mt-1 flex-shrink-0" />
                                  <p className="text-sm text-slate-700 group-hover:text-slate-900 leading-relaxed">
                                    {question}
                                  </p>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <ScrollArea className="h-96 w-full border border-slate-200 rounded-2xl p-6 bg-white/60">
                        {chatMessages.length > 0 ? (
                          <div className="space-y-6">
                            {chatMessages.map((message, index) => (
                              <div
                                key={index}
                                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                              >
                                <div
                                  className={`max-w-[80%] p-5 rounded-2xl shadow-sm ${
                                    message.role === "user"
                                      ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                                      : "bg-white border border-slate-200 text-slate-900 shadow-md"
                                  }`}
                                >
                                  <div className="flex items-start gap-4">
                                    <div
                                      className={`p-2 rounded-full ${
                                        message.role === "user" ? "bg-white/20" : "bg-blue-100"
                                      }`}
                                    >
                                      {message.role === "user" ? (
                                        <User className="h-4 w-4 text-white" />
                                      ) : (
                                        <Bot className="h-4 w-4 text-blue-600" />
                                      )}
                                    </div>
                                    <div className="flex-1">
                                      {message.isTyping ? (
                                        <div className="flex items-center gap-2">
                                          <div className="flex gap-1">
                                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                                            <div
                                              className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                                              style={{ animationDelay: "0.1s" }}
                                            ></div>
                                            <div
                                              className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                                              style={{ animationDelay: "0.2s" }}
                                            ></div>
                                          </div>
                                          <span className="text-sm text-slate-500 ml-2">Gemini is thinking...</span>
                                        </div>
                                      ) : (
                                        <>
                                          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                                          <p
                                            className={`text-xs mt-3 ${
                                              message.role === "user" ? "text-white/70" : "text-slate-500"
                                            }`}
                                          >
                                            {message.timestamp.toLocaleTimeString()}
                                          </p>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center text-slate-600 py-16">
                            <div className="p-6 bg-blue-50 rounded-2xl w-fit mx-auto mb-6">
                              <MessageSquare className="h-12 w-12 text-blue-600" />
                            </div>
                            <p className="text-xl font-semibold mb-3">Start a conversation</p>
                            <p className="text-base">
                              Ask questions about the document to get AI-powered insights from Gemini.
                            </p>
                          </div>
                        )}
                      </ScrollArea>

                      <form onSubmit={handleChatSubmit} className="flex gap-4">
                        <Input
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          placeholder="Ask a question about the document..."
                          disabled={isChatLoading}
                          className="flex-1 h-14 bg-white/80 border-slate-200 focus:border-blue-400 focus:ring-blue-400 text-base rounded-xl"
                        />
                        <Button
                          type="submit"
                          disabled={isChatLoading || !chatInput.trim()}
                          className="h-14 px-8 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-xl shadow-lg"
                        >
                          {isChatLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                        </Button>
                      </form>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  )
}
