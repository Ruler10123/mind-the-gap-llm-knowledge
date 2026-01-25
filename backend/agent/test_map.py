import sys
from pathlib import Path

# Add backend directory to path so imports work (needed for tools.base import in open_map.py)
backend_dir = Path(__file__).parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

# Import directly from same directory to avoid triggering agent/__init__.py
from open_map import OpenMapTool

def resolve_destination(text: str) -> str | None:
    t = text.lower()

    # restroom synonyms
    if any(w in t for w in ["restroom", "bathroom", "toilet", "washroom"]):
        return "RESTROOM"

    # customer service synonyms
    if any(w in t for w in ["customer service", "help desk", "service desk", "agent desk", "support desk"]):
        return "CUSTOMER_SERVICE"

    # gate patterns (basic)
    if "a28" in t or "a 28" in t:
        return "A28"
    if "b9" in t or "b 9" in t:
        return "B9"

    return None

if __name__ == "__main__":
    tool = OpenMapTool()
    while True:
        text = input("\nUser says (or 'q'): ").strip()
        if text.lower() == "q":
            break

        dest = resolve_destination(text)
        if not dest:
            print("Assistant: Do you mean a gate, restroom or customer service?")
            continue

        result = tool.run(destination=dest)
        print("Assistant: Opening map.")
        print(result)
