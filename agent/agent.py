import os
import httpx
from livekit import agents
from livekit.agents import Agent, AgentSession, RunContext, function_tool
from livekit.plugins import anthropic, cartesia, deepgram, silero

API = os.environ.get("API_URL", "http://localhost:8080")

class Concierge(Agent):
    def __init__(self):
        super().__init__(instructions=(
            "You are a friendly hotel front-desk concierge. Help guests check in. "
            "Ask for their booking reference or last name, look up the booking, confirm the "
            "guest name and dates, then check them in and tell them their room number. "
            "Keep replies short and spoken-friendly."))

    @function_tool
    async def find_booking(self, ctx: RunContext, reference: str | None = None, last_name: str | None = None) -> dict:
        """Look up a booking by reference code or guest last name."""
        params = {k: v for k, v in {"reference": reference, "last_name": last_name}.items() if v}
        async with httpx.AsyncClient() as c:
            r = await c.get(f"{API}/bookings", params=params)
        return r.json()

    @function_tool
    async def check_in_guest(self, ctx: RunContext, reference: str) -> dict:
        """Check in the guest for a confirmed booking reference. Returns room number."""
        async with httpx.AsyncClient() as c:
            r = await c.post(f"{API}/checkin", json={"reference": reference})
        return r.json()

async def entrypoint(ctx: agents.JobContext):
    session = AgentSession(
        stt=deepgram.STT(),
        llm=anthropic.LLM(model=os.environ.get("CLAUDE_MODEL", "claude-sonnet-5-5")),
        tts=cartesia.TTS(),
        vad=silero.VAD.load(),
    )
    await session.start(room=ctx.room, agent=Concierge())
    await session.generate_reply(instructions="Greet the guest and offer to help them check in.")

if __name__ == "__main__":
    agents.cli.run_app(agents.WorkerOptions(entrypoint_fnc=entrypoint))
