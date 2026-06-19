# WALSEC

WALSEC is an Autonomous Smart Contract Audit System & Terminal Assistant built for the Web3 ecosystem. It leverages a multi-agent LLM pipeline, a matrix-style hacker terminal UI, and decentralized storage to provide on-demand security auditing and intelligent development assistance.

## Features

- **Ask Walsec (Terminal Assistant):** A retro-futuristic terminal UI that acts as your AI assistant. Requires wallet connection (`@mysten/dapp-kit`) to unlock the terminal. Includes a dedicated AI Output Viewer for generated code with one-click copy functionality.
- **Wallet-Persistent Memory:** Chat history and terminal sessions are tied exclusively to your connected wallet address. If you disconnect, the terminal is locked. Reconnect, and your session is fully restored.
- **Shield (Multi-Agent Audit Pipeline):** Powered by LangGraph and Gemini 2.5 Flash, it orchestrates multiple AI agents:
  - **Analyzer:** Deep pattern recognition for Sui Move smart contracts.
  - **Executor:** Autonomous exploit simulation matrix.
  - **Evaluator:** Consensus and synthesis of the final structured JSON audit report.
- **Decentralized Storage:** Integrates with the Walrus Network (via Memwal SDK) to securely store audit artifacts and AI chat memories on-chain.

## Tech Stack

- **Framework:** Next.js (App Router)
- **AI Models:** Google Gemini (`gemini-2.5-flash`) via `@langchain/google-genai`
- **Orchestration:** LangGraph (`@langchain/langgraph`)
- **Web3 Integration:** Sui Wallet integration via `@mysten/dapp-kit`
- **Storage:** Walrus Network (Memwal SDK)

## Getting Started

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables. Copy `.env.local.example` to `.env.local` and add your API keys:
   ```bash
   GEMINI_API_KEY_1=your_gemini_key_here
   GEMINI_MODEL_PRIMARY=gemini-2.5-flash
   GEMINI_MODEL_CHEAP=gemini-2.5-flash
   GEMINI_MODEL_CHAT=gemini-2.5-flash
   # ... plus Memwal / Walrus endpoints
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser. Connect your Sui wallet to unlock the terminal.

## Architecture & Commands

- **Config Page (`/config`):** Main entry point for the "Ask Walsec" terminal interface.
- **Terminal Commands:**
  - `help` - Show available commands
  - `status` - Show node status
  - `agents` - Show swarm agent status
  - `threats` - Recent threat detections
  - `clear` - Clears the current terminal session
- **Audit Pipeline (`/api/audit`):** Initiates the LangGraph multi-agent analysis.
- **Chat Pipeline (`/api/chat`):** Handles terminal-based queries via Gemini.

## Deployment

WALSEC is fully compatible with Vercel deployment. Ensure you add all necessary environment variables to your Vercel project dashboard before deploying.

```bash
vercel --prod --yes
```
