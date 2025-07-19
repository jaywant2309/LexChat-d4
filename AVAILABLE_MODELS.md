# Available OpenRouter Models

## Recommended Models for LexChat

### Primary Models (High Quality)
1. **openai/gpt-4o** - Latest GPT-4 model, excellent for legal analysis
2. **openai/gpt-4o-mini** - Faster, cost-effective GPT-4 variant
3. **anthropic/claude-3-5-sonnet** - Excellent reasoning and analysis
4. **anthropic/claude-3-haiku** - Fast and reliable

### Fallback Models (Reliable)
1. **openai/gpt-3.5-turbo** - Reliable and fast
2. **meta-llama/llama-3.1-8b-instruct** - Open source alternative
3. **google/gemini-pro** - Google's model (if available)

## Model Selection Strategy

The application now uses a **fallback system**:

1. **Primary**: Tries `openai/gpt-4o` first
2. **Fallback 1**: If GPT-4o fails, tries `openai/gpt-4o-mini`
3. **Fallback 2**: If that fails, tries `openai/gpt-3.5-turbo`
4. **Fallback 3**: If that fails, tries `anthropic/claude-3-haiku`
5. **Final Fallback**: If all AI models fail, generates a basic summary using regex patterns

## Checking Available Models

You can check which models are currently available on OpenRouter:

\`\`\`bash
curl -H "Authorization: Bearer YOUR_API_KEY" https://openrouter.ai/api/v1/models
\`\`\`

## Cost Considerations

- **GPT-4o**: Higher quality, higher cost
- **GPT-4o-mini**: Good balance of quality and cost
- **GPT-3.5-turbo**: Lower cost, good performance
- **Claude models**: Competitive pricing and quality

The fallback system ensures your application works even if premium models are unavailable or over budget.
