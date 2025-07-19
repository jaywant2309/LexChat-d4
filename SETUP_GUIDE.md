# LexChat Setup Guide

## Environment Configuration

### Step 1: Create Environment File
1. Copy the `.env.example` file to `.env`:
   \`\`\`bash
   cp .env.example .env
   \`\`\`

2. Or create a new `.env` file in the root directory with:
   \`\`\`env
   OPENROUTER_API_KEY=your_actual_api_key_here
   \`\`\`

### Step 2: Get OpenRouter API Key
1. Visit [OpenRouter](https://openrouter.ai/keys)
2. Sign up for an account
3. Generate a new API key
4. Copy the API key (it should start with `sk-or-v1-`)

### Step 3: Configure API Key
1. Open your `.env` file
2. Replace `your_actual_api_key_here` with your real API key
3. Save the file

### Step 4: Restart Development Server
\`\`\`bash
# Stop the current server (Ctrl+C)
# Then restart
npm run dev
\`\`\`

## Troubleshooting

### Issue: "OpenRouter API key is not configured"

**Solution 1: Check .env file location**
- Ensure `.env` file is in the root directory (same level as `package.json`)
- Not in a subdirectory or nested folder

**Solution 2: Check .env file format**
\`\`\`env
# Correct format (no spaces around =)
OPENROUTER_API_KEY=sk-or-v1-your-key-here

# Incorrect formats:
# OPENROUTER_API_KEY = sk-or-v1-your-key-here (spaces)
# OPENROUTER_API_KEY="sk-or-v1-your-key-here" (quotes not needed)
\`\`\`

**Solution 3: Restart the server**
- Environment variables are only loaded when the server starts
- Always restart after changing `.env` file

**Solution 4: Check file permissions**
\`\`\`bash
# Make sure the .env file is readable
ls -la .env
\`\`\`

**Solution 5: Verify API key format**
- OpenRouter API keys start with `sk-or-v1-`
- Should be a long string of characters
- No extra characters or line breaks

### Issue: API key exists but still not working

**Check the console logs:**
1. Open browser developer tools
2. Check the Network tab for API calls
3. Look at server console for debugging info

**Verify environment loading:**
\`\`\`bash
# In your project directory
node -e "console.log(process.env.OPENROUTER_API_KEY)"
\`\`\`

## File Structure Check
\`\`\`
your-project/
├── .env                 ← API key goes here
├── .env.example        ← Template file
├── package.json
├── app/
│   ├── api/
│   │   ├── chat/
│   │   └── process-document/
│   └── page.tsx
└── ...
\`\`\`

## Testing Configuration
1. Start the development server: `npm run dev`
2. Upload a document
3. Check the console for API key debug information
4. Try asking a question in the chat

If you see debug logs showing the API key exists and has the correct length, the configuration is working.
