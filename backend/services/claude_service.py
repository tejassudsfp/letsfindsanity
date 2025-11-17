"""Claude AI service for content analysis, safety checking, and anonymization"""

import anthropic
import json
import os
from datetime import date
from services.database import db

client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

# Use the latest Sonnet model
SONNET_MODEL = "claude-sonnet-4-5-20250929"

MASTER_SYSTEM_PROMPT = """you are fred, the ai companion for letsfindsanity, a platform where builders journal and support each other anonymously.

ALWAYS start your responses with: "hi! i'm fred."

your core values:
- warmth without being patronizing
- honesty without being harsh
- supportive without giving unsolicited advice
- pattern recognition without armchair psychology

your writing style:
- always lowercase (except for proper nouns when absolutely necessary)
- conversational, like a thoughtful friend
- no corporate speak, no jargon
- short sentences when possible
- genuine, never formulaic

remember:
- these are real people with real struggles
- building something is emotionally hard
- your job is to help them process, not fix them
- you're not a therapist, you're a reflective companion
- anonymity is sacred - never suggest breaking it"""

INTENT_INSTRUCTIONS = {
    "processing": """
they're thinking out loud. help them see what they might not be seeing.
- identify the actual concern beneath the rambling
- notice emotional undertones
- don't try to solve, just reflect back clearly
""",

    "agreeing": """
they want supportive agreement. validate their perspective while adding depth.
- acknowledge what they're seeing correctly
- reinforce the wisdom in their approach
- help them feel heard and supported
- be genuine, not just cheerleading
""",

    "challenging": """
they want to see this differently. offer respectful alternative perspectives.
- what's another way to look at this?
- what might they be missing?
- play devil's advocate thoughtfully, not harshly
- be respectful and constructive, never dismissive
""",

    "solution": """
they figured something out. help them understand what made it work.
- what was the breakthrough moment?
- what can they learn from this?
- celebrate the win without being cheesy
""",

    "venting": """
they need to get it out. validate without agreeing with every thought.
- acknowledge the frustration
- separate feeling from fact
- help them see if this is pattern or one-off
- if it seems too raw to share, suggest they wait
""",

    "advice": """
they have a specific problem. help clarify the actual question.
- what are they really asking?
- what information is missing?
- what assumptions are they making?
- don't answer it - help them frame it better
""",

    "reflecting": """
they're looking back. help them see progress they might miss.
- what's changed since then?
- what growth is evident?
- what patterns are worth noting?
"""
}

ANALYSIS_PROMPT_TEMPLATE = """<intent>{intent}</intent>
<content>{content}</content>

based on what they chose to write about ({intent}), provide a private analysis just for them.

{intent_instructions}

structure your response:

1. immediate reflection (2-3 sentences)
   - what's the core feeling/theme here?
   - acknowledge it without judgment

2. patterns you notice (if any)
   - are there recurring thoughts?
   - what's beneath the surface?
   - be specific, not generic

3. a question to sit with (just one)
   - something that helps them think deeper
   - not advice, but genuine curiosity
   - something they might not have considered

tone: warm peer who's been through it. not a therapist, not a cheerleader, just someone who gets it.

keep it under 200 words. be specific to what they wrote, never generic.

remember: this is PRIVATE. only they will see this. be honest."""

SAFETY_CHECK_PROMPT = """<content>{content}</content>
<intent>{intent}</intent>

you need to decide if this is safe and valuable to share with the community.

REJECT if:
- contains identifying information (names, company names, specific locations, emails, phone numbers, identifiable details)
- contains harmful content (threats, self-harm ideation, abuse, harassment)
- is purely rage without insight (just attacking others, no reflection)
- is too specific about legal/financial situations that could identify them
- would violate someone else's privacy
- is spam or promotional

APPROVE if:
- authentic struggle that others could relate to
- vulnerable but not dangerous
- could help someone else feel less alone
- has been anonymized of identifying details
- reflects genuine building experience

return ONLY valid json (no markdown, no explanation):
{{
  "decision": "approve" or "reject",
  "reason": "brief explanation for the writer",
  "confidence": 0.0 to 1.0,
  "topics": ["array", "of", "relevant", "tags"],
  "suggestions": "if rejected, how they could edit it (optional)"
}}

topics should be lowercase, hyphenated, specific but not too narrow.
examples: "cofounder-conflict", "fundraising-anxiety", "burnout", "imposter-syndrome", "pivot-or-persevere", "first-hire", "pricing-strategy", "work-life-balance"

be thoughtful but not paranoid. the goal is safety AND community value."""

ANONYMIZATION_PROMPT = """<original_content>{content}</original_content>
<intent>{intent}</intent>
<topics>{topics}</topics>

create a version that can be shared anonymously with the community.

REMOVE:
- all names (people, companies, products)
- specific numbers (replace with approximations: "$47k" → "under $50k", "23 employees" → "~20 people")
- identifiable locations beyond region (remove "palo alto" but "bay area" is ok)
- any detail that could doxx them
- excessive rambling that doesn't add value

PRESERVE:
- emotional truth and rawness
- core dilemma or struggle
- enough context to be relatable
- the authentic voice
- key details that make it specific (not generic)

ADD:
- a clear "ask" or question based on {intent}
- slight restructuring if it helps clarity
- context if something is unclear

CONSTRAINTS:
- keep it under 400 words
- maintain lowercase style
- don't make it sound robotic or corporate
- don't add fake enthusiasm
- the ask should be genuine, not forced

return ONLY valid json (no markdown, no explanation):
{{
  "anonymized_content": "the cleaned version",
  "clear_ask": "the specific question/ask to add",
  "changes_made": "brief note on what you changed"
}}"""

UNIFIED_ANALYSIS_PROMPT = """<intent>{intent}</intent>

{linked_sessions_header}

<current_entry>
{content}
</current_entry>

you need to provide a complete analysis of this writing session with these parts:

1. PRIVATE ANALYSIS (just for the writer):
{intent_instructions}

hey, thanks for showing me this.

## my thoughts:

be EXHAUSTIVE in your analysis. this isn't a surface-level response. go deep:
- what patterns do you see in their thinking?
- what emotions are driving this?
- what assumptions might they be making?
- what are they not saying but clearly feeling?
- what's the real question beneath the surface?

use markdown headings (##, ###) to structure your response. write like a thoughtful friend who sees through bullshit. be:
- deeply personal and insightful
- brutally honest but never harsh
- use metaphors and imagery when they resonate
- go beyond the obvious to the emotional core
- profound without being clinical

## what i notice:
point out specific patterns, contradictions, or insights from their writing.

if they've linked previous sessions:
- **explicitly mention patterns across entries** - "i notice in your july entry you were struggling with X, and now you're..."
- **track progress** - "last time you wrote about this, you felt Y. now you seem to feel Z"
- **connect dots** - "this connects to what you said about [topic from previous entry]"
- make it clear you're seeing the bigger picture across their journal, not just this one entry

## what might help:
based on their INTENT, give them SPECIFIC, ACTIONABLE things to consider. not generic advice. real suggestions.

## what you could do next:
give them 2-3 CONCRETE, SPECIFIC actions they can take based on what they wrote. these should be:
- directly connected to their specific situation (not generic "meditate more" bullshit)
- achievable within the next few days or week
- small enough to actually do, not overwhelming
- framed as experiments or options, not mandates

format each action like this:
- **[specific action]** - why this might help based on what they wrote

examples:
- **reach out to that person you mentioned** - sounds like this conversation is stuck in your head. sometimes saying it out loud changes everything.
- **write down your three non-negotiables for this decision** - you're circling around what matters, but haven't named it yet.
- **block 2 hours tomorrow to just build the thing** - you've been thinking about it for weeks. the thinking won't get you unstuck, the doing will.

make these ULTRA-SPECIFIC to what they wrote. if they mentioned a cofounder issue, the action should address that. if they're stuck on pricing, give them a concrete pricing experiment to run. if they're burnt out, suggest a specific way to create space (not just "take a break").

keep it conversational but THOROUGH. aim for 400-500 words of genuine insight, not fluff.

2. SAFETY CHECK:
decide if this is safe and valuable to share with the community.

REJECT if:
- contains identifying information (names, company names, specific locations, emails, phone numbers, identifiable details)
- contains harmful content (threats, self-harm ideation, abuse, harassment, severe mental health crisis)
- is purely rage without insight (just attacking others, no reflection)
- is too specific about legal/financial situations that could identify them
- would violate someone else's privacy
- is spam or promotional

**IMPORTANT - MENTAL HEALTH CRISIS DETECTION:**
if the content indicates severe mental health distress, self-harm ideation, suicidal thoughts, or crisis-level struggles:
- REJECT the post (it shouldn't be shared publicly)
- in the "reason" field, gently suggest they speak with a mental health professional
- be compassionate but clear: this platform is for peer support among builders, not crisis intervention
- example reason: "this sounds really tough, and you deserve real support. while we're here for builder struggles, what you're describing needs professional care. please consider reaching out to a therapist or crisis hotline. you're not alone in this."

**SPECIAL HANDLING FOR REJECTIONS (identifying info, too specific, etc):**
if rejecting because of identifying details or being too specific (NOT mental health crisis):
- in "suggestions": offer to help them share anonymously
- create an "alternative_post" with:
  - all identifying info removed
  - essence preserved
  - ready to post as-is or edit
  - same emotional truth, zero doxxing risk
  - relevant topics only (remove overly specific ones)
- be encouraging: "hey, you could benefit from posting this and getting ideas from the community. want to share this version instead? you can modify it or post as is!"

APPROVE if:
- authentic struggle that others could relate to
- vulnerable but not dangerous
- could help someone else feel less alone
- has been anonymized of identifying details
- reflects genuine building experience
- challenges are significant but within the scope of peer support

provide: decision (approve/reject), reason, confidence (0.0-1.0), topics array (lowercase, hyphenated, specific but not too narrow), suggestions (if rejected), recommend_professional_help (true/false), alternative_post (if rejected for privacy reasons, not mental health)

3. SUGGESTED PUBLIC POST (ALWAYS CREATE THIS):
ALWAYS create a suggested public post version, regardless of safety decision. This gives the user the option to share.

create a version that can be shared anonymously:

REMOVE:
- all names (people, companies, products)
- specific numbers (replace with approximations)
- identifiable locations beyond region
- any detail that could doxx them
- excessive rambling

PRESERVE:
- emotional truth and rawness
- core dilemma or struggle
- enough context to be relatable
- the authentic voice

ADD:
- a compelling **title** (5-10 words, lowercase, captures the essence from their writing)
- a clear "ask" or question based on {intent}

ALSO CREATE:
- a **journal_title** - a short title (5-8 words) for their private journal entry that captures what they wrote about

4. FINAL SAFETY CHECK (for the suggested post):
verify the suggested post itself is safe:
- no identifying information
- appropriate for community sharing
- no mental health crisis content

return ONLY valid json (no markdown, no explanation):
{{
  "journal_title": "short title for their private journal entry",
  "analysis": "your private reflection for the writer (with markdown headings, conversational)",
  "safety": {{
    "decision": "approve or reject",
    "reason": "brief explanation about the ORIGINAL content",
    "confidence": 0.0 to 1.0,
    "topics": ["array", "of", "tags"],
    "suggestions": "encouraging message",
    "recommend_professional_help": true or false
  }},
  "suggested_post": {{
    "title": "compelling title for the public post",
    "content": "the cleaned anonymized version (1-2 paragraphs max)",
    "clear_ask": "the specific question/ask",
    "topics": ["relevant", "searchable", "topics"],
    "safe_to_publish": true or false,
    "safety_notes": "brief note if not safe, empty string if safe"
  }}
}}

IMPORTANT: always include both journal_title and suggested_post."""


def analyze_writing(content, intent):
    """Get private analysis from Claude"""

    intent_instructions = INTENT_INSTRUCTIONS.get(intent, INTENT_INSTRUCTIONS["processing"])

    prompt = ANALYSIS_PROMPT_TEMPLATE.format(
        intent=intent,
        content=content,
        intent_instructions=intent_instructions
    )

    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1000,
        system=MASTER_SYSTEM_PROMPT,
        messages=[{
            "role": "user",
            "content": prompt
        }]
    )

    return response.content[0].text


def safety_check(content, intent):
    """Check if content is safe to share"""

    prompt = SAFETY_CHECK_PROMPT.format(
        content=content,
        intent=intent
    )

    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=800,
        system=MASTER_SYSTEM_PROMPT,
        messages=[{
            "role": "user",
            "content": prompt
        }]
    )

    result_text = response.content[0].text.strip()

    # Remove markdown code blocks if present
    if result_text.startswith("```"):
        result_text = result_text.split("\n", 1)[1]
        result_text = result_text.rsplit("```", 1)[0]

    return json.loads(result_text)


def anonymize_content(content, intent, topics):
    """Create anonymized version for sharing"""

    prompt = ANONYMIZATION_PROMPT.format(
        content=content,
        intent=intent,
        topics=json.dumps(topics)
    )

    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1200,
        system=MASTER_SYSTEM_PROMPT,
        messages=[{
            "role": "user",
            "content": prompt
        }]
    )

    result_text = response.content[0].text.strip()

    # Remove markdown code blocks if present
    if result_text.startswith("```"):
        result_text = result_text.split("\n", 1)[1]
        result_text = result_text.rsplit("```", 1)[0]

    return json.loads(result_text)


def track_api_usage(service, operation, usage):
    """Track API token usage for analytics"""
    try:
        today = date.today()

        input_tokens = usage.input_tokens
        output_tokens = usage.output_tokens
        cache_creation = getattr(usage, 'cache_creation_input_tokens', 0)
        cache_read = getattr(usage, 'cache_read_input_tokens', 0)

        # Calculate cost (example rates - adjust based on actual pricing)
        # Sonnet 4.5 pricing: $3/$15 per million tokens (input/output)
        cost = (input_tokens * 3.0 / 1_000_000) + (output_tokens * 15.0 / 1_000_000)
        if cache_creation:
            cost += (cache_creation * 3.75 / 1_000_000)  # Cache writes are slightly higher
        if cache_read:
            cost += (cache_read * 0.30 / 1_000_000)  # Cache reads are 90% cheaper

        # Insert or update daily API usage
        db.execute("""
            INSERT INTO api_usage (date, service, operation, input_tokens, output_tokens,
                                  cache_creation_tokens, cache_read_tokens, cost_usd)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (date, service, operation)
            DO UPDATE SET
                input_tokens = api_usage.input_tokens + EXCLUDED.input_tokens,
                output_tokens = api_usage.output_tokens + EXCLUDED.output_tokens,
                cache_creation_tokens = api_usage.cache_creation_tokens + EXCLUDED.cache_creation_tokens,
                cache_read_tokens = api_usage.cache_read_tokens + EXCLUDED.cache_read_tokens,
                cost_usd = api_usage.cost_usd + EXCLUDED.cost_usd
        """, [today, service, operation, input_tokens, output_tokens, cache_creation, cache_read, cost], commit=True)
    except Exception as e:
        print(f"Failed to track API usage: {e}")
        # Don't fail the main operation if analytics tracking fails


def complete_analysis(content, intent, linked_sessions=None, user_historical_topics=None):
    """
    Complete analysis pipeline using a single LLM call with prompt caching.
    Returns:
    1. Auto-generated journal title
    2. Private analysis
    3. Safety check
    4. Suggested public post (ALWAYS)

    Args:
        content: Current journal entry content
        intent: Writing intent
        linked_sessions: List of previous sessions for context (max 2)
        user_historical_topics: List of all topics this user has used before
    """

    intent_instructions = INTENT_INSTRUCTIONS.get(intent, INTENT_INSTRUCTIONS["processing"])

    # Build header and context from linked sessions if provided
    linked_sessions_header = ""
    if linked_sessions and len(linked_sessions) > 0:
        linked_sessions_header = "<previous_sessions>\n"
        linked_sessions_header += f"the writer has linked {len(linked_sessions)} previous journal entr{'y' if len(linked_sessions) == 1 else 'ies'} for context. use these to identify patterns, track progress, and provide deeper insights.\n\n"

        for i, session in enumerate(linked_sessions, 1):
            linked_sessions_header += f"## Previous Entry {i}: {session['title']}\n"
            linked_sessions_header += f"Date: {session['completed_at']}\n"
            if session.get('topics'):
                linked_sessions_header += f"Topics: {', '.join(session['topics'])}\n"
            linked_sessions_header += f"\n{session['content']}\n"
            linked_sessions_header += "\n---\n"
        linked_sessions_header += "</previous_sessions>\n"
    else:
        linked_sessions_header = "no previous sessions linked for this entry.\n"

    # Add historical topics for consistency
    topics_context = ""
    if user_historical_topics and len(user_historical_topics) > 0:
        topics_context = f"\n\n<user_historical_topics>\nThis user has previously written about these topics: {', '.join(user_historical_topics)}\n\nWhen assigning topics, REUSE these existing topics if they match the content. Only create new topics if the content truly covers something new. This maintains topic consistency across their journal.\n</user_historical_topics>\n"

    prompt = UNIFIED_ANALYSIS_PROMPT.format(
        intent=intent,
        content=content,
        intent_instructions=intent_instructions,
        linked_sessions_header=linked_sessions_header
    ) + topics_context

    # Use prompt caching on the system prompt to reduce cost and latency
    response = client.messages.create(
        model=SONNET_MODEL,
        max_tokens=3000,
        system=[
            {
                "type": "text",
                "text": MASTER_SYSTEM_PROMPT,
                "cache_control": {"type": "ephemeral"}
            }
        ],
        messages=[{
            "role": "user",
            "content": prompt
        }]
    )

    # Track API usage
    track_api_usage('claude', 'analysis', response.usage)

    result_text = response.content[0].text.strip()

    # Remove markdown code blocks if present
    if result_text.startswith("```"):
        result_text = result_text.split("\n", 1)[1]
        result_text = result_text.rsplit("```", 1)[0]

    parsed = json.loads(result_text)

    # Transform to match the expected format
    result = {
        "journal_title": parsed.get("journal_title", "untitled"),
        "private_reflection": parsed.get("analysis", ""),
        "safety_check": {
            "decision": parsed["safety"]["decision"],
            "reason": parsed["safety"]["reason"],
            "confidence": parsed["safety"]["confidence"],
            "topics": parsed["safety"]["topics"],
            "suggestions": parsed["safety"].get("suggestions", ""),
            "recommend_professional_help": parsed["safety"].get("recommend_professional_help", False)
        },
        "suggested_post": {
            "title": parsed["suggested_post"]["title"],
            "content": parsed["suggested_post"]["content"],
            "clear_ask": parsed["suggested_post"]["clear_ask"],
            "topics": parsed["suggested_post"]["topics"],
            "safe_to_publish": parsed["suggested_post"]["safe_to_publish"],
            "safety_notes": parsed["suggested_post"].get("safety_notes", "")
        }
    }

    return result
