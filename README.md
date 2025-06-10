# Chat LLMs API
This is a backend API for a chat application that integrates with Large Language Models (LLMs) through Ollama. The application allows users to create chats, send messages, upload documents (PDF, DOCX, TXT), and get AI-generated responses based on their queries and uploaded documents.

## Features
- User authentication with JWT
- Google OAuth integration
- Chat and message management
- File uploads (images and documents)
- Document processing and vector embeddings
- Retrieval-Augmented Generation (RAG) for document-based queries
- Integration with Ollama for LLM inference

## Prerequisites
### Required Software
- Node.js (v18+)
- PostgreSQL database
- Ollama - Must be installed and running locally or accessible via network
- ChromaDB (for vector storage)

### Installing Ollama
1. Download Ollama from the official website
2. Install it following the instructions for your operating system
3. Start Ollama service
4. Pull a model (recommended: gemma3)
   ```
   ollama pull gemma3
   ```

## Environment Setup
Create a .env file based on the .env.example with the following variables:

```
DATABASE_URL="postgresql://username:password@localhost:5432/dbname"
JWT_SECRET="your-jwt-secret"
JWT_EXPIRATION="24h"
LLM_MODEL_DEFAULT="llama3"
OLLAMA_BASE_URL="http://
localhost:11434"
CHROMA_URL="http://
localhost:8000"
FRONTEND_URL="http://
localhost:3000"
APP_URL="http://localhost:4000"
```
## Installation
```
# Install dependencies
npm install

# Run database migrations
npx prisma migrate dev

# Start the application
npm run start:dev
```

## API Endpoints
### Authentication
- POST /auth/register - Register a new user
- POST /auth/login - Login and get JWT token
- GET /auth/google - Google OAuth login
- GET /auth/google/callback - Google OAuth callback

### Chats (Authenticated)
- GET /chat - Get all user chats
- POST /chat - Create a new chat
- GET /chat/:id - Get a specific chat with messages
- DELETE /chat/:id - Delete a chat
- POST /chat/:id/message - Send a message to a chat

### Files (Authenticated)
- POST /files/upload - Upload an image file
- GET /files/:filename - Get an uploaded image

### Documents (Authenticated)
- POST /files/upload-document - Upload and process a document (PDF, DOCX, TXT)
- GET /files/documents - Get all user documents
- GET /files/document/:filename - Get document content
- DELETE /files/document/:filename - Delete a document
- POST /files/search - Search within user documents

### LLM (Authenticated)
- GET /llm/health - Check LLM service health
- POST /llm/query-documents - Query LLM with RAG using uploaded documents

