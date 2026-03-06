import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Correct imports for 2026 LangChain architecture
from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI

# 1. Load the API Key from your .env file
load_dotenv()
API_KEY = os.getenv("GOOGLE_API_KEY")

# 2. Initialize FastAPI
app = FastAPI()

# 3. Enable CORS
# This allows your React frontend (usually port 3000 or 5173) to talk to this Python server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 4. Setup Gemini (Stable 2026 Configuration)
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash", 
    google_api_key=API_KEY,
    transport="rest"
)

# 5. Define the Data Structure
class UserQuery(BaseModel):
    message: str

# 6. The Chat Logic (Updated for Lokarya specific features)
@app.post("/chat")
async def chat_endpoint(query: UserQuery):
    try:
        system_instruction = (
    "You are Lokarya AI, the official assistant for the Lokarya civic platform. "
    "Your ONLY purpose is to help users with: Complaints, Activities, Missions, and Rewards within the app.\n\n"

    "### OFF-TOPIC RULE:\n"
    "- If a user asks about anything unrelated to Lokarya (e.g., cooking, jokes, general knowledge, other apps, or personal advice), "
    "respond with: 'I am sorry, I can only assist with Lokarya-related civic activities and app navigation. How can I help you with the platform today?'\n\n"

    "### FORMATTING RULES:\n"
    "1. NEVER use asterisks (*) for bullet points or lists. Use 📍 or ✅ instead.\n"
    "2. Use **Bold Text** for app sections only.\n"
    "3. Keep it brief and professional."
)
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", system_instruction),
            ("human", "{input}")
        ])

        chain = prompt | llm
        response = chain.invoke({"input": query.message})
        
        return {"reply": response.content}
    
    except Exception as e:
        return {"reply": f"Error: {str(e)}"}


# 7. Run the server
if __name__ == "__main__":
    import uvicorn
    # Runs on http://localhost:8000
    uvicorn.run(app, host="0.0.0.0", port=8000)