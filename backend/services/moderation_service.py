"""Comment moderation service using Claude Haiku for fast, low-cost checks"""

import anthropic
import json
import os

client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

# Use Haiku for fast, cost-effective moderation
HAIKU_MODEL = "claude-haiku-4-5-20251001"

MODERATION_SYSTEM_PROMPT = """you are a comment moderator for letsfindsanity, a supportive community for builders.

your job is to keep the space safe and encouraging while allowing genuine perspectives.

ALLOW:
- supportive encouragement and validation
- challenging perspectives that are respectful and constructive
- advice that's well-intentioned and thoughtful
- sharing similar experiences
- asking clarifying questions
- gentle disagreement with reasoning

BLOCK:
- obscene language or profanity
- derogatory terms or insults
- dismissive or condescending tone
- attacks on the person rather than ideas
- anything that would make someone feel bad about themselves
- unconstructive criticism without alternatives
- toxic positivity that dismisses real struggles

remember: challenging someone's perspective is okay if done respectfully. being harsh or making someone feel small is not."""

MODERATION_PROMPT = """<comment>{content}</comment>

check if this comment is appropriate for a supportive builder community.

return ONLY valid json (no markdown, no explanation):
{{
  "approved": true or false,
  "reason": "brief explanation of why it was approved or blocked",
  "severity": "low, medium, or high (if blocked, how severe is the issue)",
  "suggestion": "if blocked, how they could rewrite it (optional)"
}}"""


def moderate_comment(content):
    """
    Check if a comment is appropriate to post.
    Returns: dict with approved (bool), reason (str), severity (str), suggestion (str)
    """

    prompt = MODERATION_PROMPT.format(content=content)

    response = client.messages.create(
        model=HAIKU_MODEL,
        max_tokens=400,
        system=MODERATION_SYSTEM_PROMPT,
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
