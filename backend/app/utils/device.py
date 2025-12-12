from typing import Optional

def is_mobile_user_agent(user_agent: Optional[str]) -> bool:
    """
    Heuristic detection of mobile clients based on User-Agent string.
    """
    if not user_agent:
        return False
    ua = user_agent.lower()
    return any(token in ua for token in ["iphone", "android", "ipad", "mobile", "ipod"])
