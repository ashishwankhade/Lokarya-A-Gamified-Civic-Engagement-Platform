import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI

# 1. Load the API Key from your .env file
load_dotenv()
API_KEY = os.getenv("GOOGLE_API_KEY")

# 2. Initialize FastAPI
app = FastAPI()

# 3. Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 4. Setup Gemini
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    google_api_key=API_KEY,
    transport="rest"
)

# 5. Define the Data Structure
class UserQuery(BaseModel):
    message: str

# 6. Predefined answers — these return instantly without any API call
PREDEFINED_ANSWERS = {
    # ── Registration ────────────────────────────────────────────────
    "how do i register for a mission?": (
        "To register for a mission:\n\n"
        "✅ Go to **Activities** from the bottom nav\n"
        "✅ Browse available missions in your city\n"
        "✅ Tap a mission → Press **Register**\n"
        "✅ You'll get a confirmation + reminder notification\n\n"
        "Show up at the venue on time to earn your XP! 🎯"
    ),
    "how to register for a mission?": (
        "To register for a mission:\n\n"
        "✅ Go to **Activities** from the bottom nav\n"
        "✅ Browse available missions in your city\n"
        "✅ Tap a mission → Press **Register**\n"
        "✅ You'll get a confirmation + reminder notification\n\n"
        "Show up at the venue on time to earn your XP! 🎯"
    ),

    # ── QR Scan ──────────────────────────────────────────────────────
    "how do i scan the qr code at the venue?": (
        "To scan the QR code at an event:\n\n"
        "✅ Open the Lokarya app and tap **Scan QR** in the bottom bar\n"
        "✅ Point your camera at the QR code displayed at the venue\n"
        "✅ Your attendance is marked automatically\n\n"
        "📍 Make sure GPS is enabled — location is verified along with the scan."
    ),
    "how to scan qr at venue?": (
        "To scan the QR code at an event:\n\n"
        "✅ Open the Lokarya app and tap **Scan QR** in the bottom bar\n"
        "✅ Point your camera at the QR code displayed at the venue\n"
        "✅ Your attendance is marked automatically\n\n"
        "📍 Make sure GPS is enabled — location is verified along with the scan."
    ),

    # ── XP ───────────────────────────────────────────────────────────
    "how do i earn xp on lokarya?": (
        "You earn XP by:\n\n"
        "✅ Attending civic missions & events\n"
        "✅ Submitting verified civic complaints\n"
        "✅ Completing special challenges\n"
        "✅ Referring friends to the platform\n\n"
        "More XP = higher rank and better rewards! 🏆"
    ),
    "how do i earn xp?": (
        "You earn XP by:\n\n"
        "✅ Attending civic missions & events\n"
        "✅ Submitting verified civic complaints\n"
        "✅ Completing special challenges\n"
        "✅ Referring friends to the platform\n\n"
        "More XP = higher rank and better rewards! 🏆"
    ),

    # ── Ranks ────────────────────────────────────────────────────────
    "what are the xp ranks and levels?": (
        "**XP Ranks on Lokarya:**\n\n"
        "✅ 🌱 Newcomer — 0 to 199 XP\n"
        "✅ 🔵 Civic Starter — 200 to 499 XP\n"
        "✅ ⚡ Active Citizen — 500 to 999 XP\n"
        "✅ 🥈 Community Hero — 1000 to 2499 XP\n"
        "✅ 🏆 Lokarya Champion — 2500+ XP\n\n"
        "Keep attending missions to climb the ranks!"
    ),
    "what are the xp ranks?": (
        "**XP Ranks on Lokarya:**\n\n"
        "✅ 🌱 Newcomer — 0 to 199 XP\n"
        "✅ 🔵 Civic Starter — 200 to 499 XP\n"
        "✅ ⚡ Active Citizen — 500 to 999 XP\n"
        "✅ 🥈 Community Hero — 1000 to 2499 XP\n"
        "✅ 🏆 Lokarya Champion — 2500+ XP\n\n"
        "Keep attending missions to climb the ranks!"
    ),

    # ── GPS ──────────────────────────────────────────────────────────
    "what is gps verification for attendance?": (
        "**GPS Verification** ensures you're physically present at the event location.\n\n"
        "✅ When you scan the QR code, the app checks your GPS coordinates\n"
        "✅ You must be within **100 metres** of the venue\n"
        "✅ If GPS fails, make sure Location permission is set to **Always On**\n\n"
        "📍 This prevents fake check-ins and keeps missions fair for everyone."
    ),
    "what is gps verification?": (
        "**GPS Verification** ensures you're physically present at the event location.\n\n"
        "✅ When you scan the QR code, the app checks your GPS coordinates\n"
        "✅ You must be within **100 metres** of the venue\n"
        "✅ If GPS fails, make sure Location permission is set to **Always On**\n\n"
        "📍 This prevents fake check-ins and keeps missions fair for everyone."
    ),

    # ── Missions ─────────────────────────────────────────────────────
    "what kind of missions are available?": (
        "**Mission types on Lokarya:**\n\n"
        "✅ 🌳 Environmental — Tree plantation, cleanliness drives\n"
        "✅ 🏫 Education — Awareness camps, skill workshops\n"
        "✅ 🏥 Health — Blood donation, health checkup camps\n"
        "✅ 🚦 Civic — Road safety, voter awareness\n"
        "✅ 🆘 Emergency — Disaster relief, community support\n\n"
        "Go to **Activities** to see live missions near you!"
    ),
    "what missions are available?": (
        "**Mission types on Lokarya:**\n\n"
        "✅ 🌳 Environmental — Tree plantation, cleanliness drives\n"
        "✅ 🏫 Education — Awareness camps, skill workshops\n"
        "✅ 🏥 Health — Blood donation, health checkup camps\n"
        "✅ 🚦 Civic — Road safety, voter awareness\n"
        "✅ 🆘 Emergency — Disaster relief, community support\n\n"
        "Go to **Activities** to see live missions near you!"
    ),

    # ── Greeting / Hello ─────────────────────────────────────────────
    "hi": (
        "Namaste! 🙏 Welcome to **Lokarya**!\n\n"
        "I can help you with:\n"
        "✅ Registering for missions\n"
        "✅ Scanning QR codes at events\n"
        "✅ Understanding XP & ranks\n"
        "✅ Reporting civic issues\n\n"
        "What would you like to know?"
    ),
    "hello": (
        "Namaste! 🙏 Welcome to **Lokarya**!\n\n"
        "I can help you with:\n"
        "✅ Registering for missions\n"
        "✅ Scanning QR codes at events\n"
        "✅ Understanding XP & ranks\n"
        "✅ Reporting civic issues\n\n"
        "What would you like to know?"
    ),
    "hey": (
        "Namaste! 🙏 Welcome to **Lokarya**!\n\n"
        "I can help you with:\n"
        "✅ Registering for missions\n"
        "✅ Scanning QR codes at events\n"
        "✅ Understanding XP & ranks\n"
        "✅ Reporting civic issues\n\n"
        "What would you like to know?"
    ),

    # ── Complaints / Reporting ────────────────────────────────────────
    "how do i report a civic issue?": (
        "To report a civic issue:\n\n"
        "✅ Tap **Report** (📍 icon) in the bottom nav\n"
        "✅ Select the issue category (Road, Water, Garbage, etc.)\n"
        "✅ Upload a photo and describe the problem\n"
        "✅ Your GPS location is auto-attached\n"
        "✅ Submit — your report goes to the local authority\n\n"
        "You earn XP for every verified complaint! 🌟"
    ),
    "how to report an issue?": (
        "To report a civic issue:\n\n"
        "✅ Tap **Report** (📍 icon) in the bottom nav\n"
        "✅ Select the issue category (Road, Water, Garbage, etc.)\n"
        "✅ Upload a photo and describe the problem\n"
        "✅ Your GPS location is auto-attached\n"
        "✅ Submit — your report goes to the local authority\n\n"
        "You earn XP for every verified complaint! 🌟"
    ),

    # ── Rewards ──────────────────────────────────────────────────────
    "how do rewards work?": (
        "**Rewards on Lokarya:**\n\n"
        "✅ Earn XP by attending missions and submitting complaints\n"
        "✅ Redeem XP for vouchers, discounts, and civic badges\n"
        "✅ Top citizens get featured on the **Leaderboard**\n"
        "✅ Special rewards for reaching Champion rank 🏆\n\n"
        "Visit the **Rewards** section to see what's available!"
    ),
    "what are the rewards?": (
        "**Rewards on Lokarya:**\n\n"
        "✅ Earn XP by attending missions and submitting complaints\n"
        "✅ Redeem XP for vouchers, discounts, and civic badges\n"
        "✅ Top citizens get featured on the **Leaderboard**\n"
        "✅ Special rewards for reaching Champion rank 🏆\n\n"
        "Visit the **Rewards** section to see what's available!"
    ),

    # ── What is Lokarya ───────────────────────────────────────────────
    "what is lokarya?": (
        "**Lokarya** is a civic engagement platform that connects citizens with their community.\n\n"
        "✅ Join **missions** — attend civic events and drives\n"
        "✅ **Report** local issues like potholes, garbage, broken lights\n"
        "✅ Earn **XP & rewards** for your civic contributions\n"
        "✅ Climb the **leaderboard** and become a Lokarya Champion 🏆\n\n"
        "Together, we build better cities! 🌆"
    ),
    "tell me about lokarya": (
        "**Lokarya** is a civic engagement platform that connects citizens with their community.\n\n"
        "✅ Join **missions** — attend civic events and drives\n"
        "✅ **Report** local issues like potholes, garbage, broken lights\n"
        "✅ Earn **XP & rewards** for your civic contributions\n"
        "✅ Climb the **leaderboard** and become a Lokarya Champion 🏆\n\n"
        "Together, we build better cities! 🌆"
    ),
    "scholarships for students": (
        "You can explore various student schemes on the **National Scholarship Portal (NSP)**.\n\n"
        "✅ **PM-YASASVI**: For OBC/EBC students\n"
        "✅ **Post-Matric Scholarship**: For SC/ST students\n\n"
        "📍 **How to apply:** Visit scholarships.gov.in and register with your Aadhaar and academic docs."
    ),
    "farmer schemes": (
        "Common schemes for farmers include:\n\n"
        "✅ **PM-KISAN**: ₹6,000 annual income support\n"
        "✅ **PM-KUSUM**: Subsidies for solar pumps\n\n"
        "📍 **How to apply:** Visit pmkisan.gov.in or your local Krishi Bhavan."
    )
}


# 7. The Chat Logic
@app.post("/chat")
async def chat_endpoint(query: UserQuery):
    try:
        # ── Check predefined answers first (zero API cost) ──────────
        normalized = query.message.strip().lower()
        if normalized in PREDEFINED_ANSWERS:
            return {"reply": PREDEFINED_ANSWERS[normalized]}

        # ── Fall through to Gemini for everything else ───────────────
        system_instruction = (
    "You are Lokarya AI, the official assistant for the Lokarya civic platform. "
    "Your purpose is to help users with: Complaints, Activities, Missions, Rewards, "
    "and Information on Government Schemes (Farmers, Students, and Environment).\n\n"

    "### SCHEME INFORMATION RULE:\n"
    "- When asked about government schemes (e.g., PM-KUSUM for farmers, NSP for students, or Green India for environment):\n"
    "  1. Provide a brief summary of the scheme.\n"
    "  2. Tell the user **where to apply** (e.g., 'Apply via the official myScheme portal or the specific department website').\n"
    "  3. Mention any required documents if known.\n\n"

    "### OFF-TOPIC RULE:\n"
    "- If a user asks about anything unrelated to Lokarya or Indian Govt Schemes (e.g., cooking, jokes, general news), "
    "respond with: 'I am sorry, I can only assist with Lokarya activities and official Government Schemes. How can I help you today?'\n\n"

    "### FORMATTING RULES:\n"
    "1. NEVER use asterisks (*) for bullet points. Use 📍 or ✅ instead.\n"
    "2. Use **Bold Text** for app sections or Scheme Names.\n"
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


# 8. Run the server
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))