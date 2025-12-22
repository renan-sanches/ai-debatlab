# OpenRouter API - Models Endpoint

## Endpoint
GET https://openrouter.ai/api/v1/models

## Authentication
Authorization: Bearer <token>

## Response Structure
```json
{
  "data": [
    {
      "id": "openai/gpt-4",
      "canonical_slug": "openai/gpt-4",
      "name": "GPT-4",
      "created": 1692901234,
      "pricing": {
        "prompt": "0.00003",
        "completion": "0.00006",
        "request": "0",
        "image": "0"
      },
      "context_length": 8192,
      "architecture": {
        "modality": "text->text",
        "input_modalities": ["text"],
        "output_modalities": ["text"]
      },
      "tokenizer": "GPT"
    }
  ]
}
```

## Key Fields
- id: Model identifier for API calls
- name: Display name
- input_modalities: ["text"] or ["text", "image"] for vision models
- pricing: Cost per token
- context_length: Max tokens
