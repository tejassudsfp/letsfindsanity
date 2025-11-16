"""Three-word identity generation service"""

import random
from .database import db

ADJECTIVES = [
    "quiet", "bold", "gentle", "fierce", "calm", "wild", "free", "brave",
    "silver", "golden", "crimson", "azure", "emerald", "amber", "violet", "pearl",
    "ancient", "modern", "distant", "nearby", "hidden", "visible", "sacred", "simple",
    "swift", "slow", "deep", "shallow", "bright", "dark", "warm", "cool",
    "northern", "southern", "eastern", "western", "central", "coastal", "mountain", "valley",
    "morning", "evening", "midnight", "dawn", "dusk", "twilight", "daybreak", "sunset",
    "winter", "summer", "spring", "autumn", "frost", "bloom", "harvest", "snow",
    "lunar", "solar", "stellar", "cosmic", "earthly", "celestial", "mystic", "primal",
    "eternal", "fleeting", "endless", "brief", "timeless", "momentary", "lasting", "passing"
]

NOUNS_1 = [
    "thunder", "whisper", "echo", "shadow", "light", "spark", "flame", "ember",
    "river", "mountain", "ocean", "forest", "desert", "valley", "canyon", "peak",
    "wind", "rain", "storm", "cloud", "mist", "fog", "snow", "ice",
    "star", "moon", "sun", "comet", "planet", "galaxy", "nebula", "void",
    "stone", "crystal", "diamond", "jade", "ruby", "sapphire", "opal", "pearl",
    "wave", "tide", "current", "stream", "brook", "cascade", "waterfall", "spring",
    "pine", "oak", "willow", "cedar", "birch", "maple", "ash", "elm",
    "hawk", "eagle", "raven", "dove", "owl", "falcon", "phoenix", "swan"
]

NOUNS_2 = [
    "peaks", "valleys", "shores", "depths", "heights", "plains", "hills", "cliffs",
    "dreams", "paths", "roads", "trails", "ways", "routes", "journeys", "quests",
    "tides", "waves", "currents", "flows", "streams", "rivers", "seas", "oceans",
    "winds", "storms", "calms", "breezes", "gales", "tempests", "zephyrs", "gusts",
    "fields", "meadows", "groves", "woods", "gardens", "orchards", "glades", "thickets",
    "songs", "tales", "legends", "myths", "stories", "chronicles", "sagas", "ballads",
    "lights", "shadows", "echoes", "whispers", "voices", "calls", "cries", "hymns",
    "realms", "kingdoms", "empires", "domains", "lands", "worlds", "spheres", "horizons"
]


def generate_three_word_id():
    """Generate unique three-word identifier"""
    max_attempts = 100

    for _ in range(max_attempts):
        word_id = f"{random.choice(ADJECTIVES)}-{random.choice(NOUNS_1)}-{random.choice(NOUNS_2)}"

        # Check if exists in database
        existing = db.execute(
            "SELECT id FROM users WHERE three_word_id = %s",
            [word_id],
            fetch_one=True
        )

        if not existing:
            return word_id

    raise Exception("Could not generate unique three-word ID after 100 attempts")


def check_three_word_exists(three_word_id):
    """Check if a three-word ID exists"""
    result = db.execute(
        "SELECT id FROM users WHERE three_word_id = %s",
        [three_word_id],
        fetch_one=True
    )
    return result is not None


def generate_identity_options(count=3):
    """Generate multiple three-word ID options for user to choose from"""
    options = []
    for _ in range(count):
        options.append(generate_three_word_id())
    return options
