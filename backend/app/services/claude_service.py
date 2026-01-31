import os
import anthropic
from dotenv import load_dotenv

load_dotenv()

def get_anthropic_client():
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        print("⚠️ Warning: ANTHROPIC_API_KEY not found in environment variables.")
        return None
    return anthropic.Anthropic(api_key=api_key)

def get_claude_response(system_prompt, user_prompt, image_data=None, model="claude-3-5-sonnet-20240620", max_tokens=1000):
    """
    Generates a response from Claude 3.5 Sonnet.
    
    Args:
        system_prompt (str): The system instructions.
        user_prompt (str): The text query.
        image_data (bytes, optional): Image data for vision tasks.
        model (str): Model version.
        max_tokens (int): Max response length.
    """
    client = get_anthropic_client()
    if not client:
        return "Error: ANTHROPIC_API_KEY is missing."

    try:
        messages = []
        
        if image_data:
            import base64
            encoded_image = base64.b64encode(image_data).decode("utf-8")
            messages.append({
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": "image/jpeg", # Assuming JPEG for now, or detect
                            "data": encoded_image
                        }
                    },
                    {
                        "type": "text",
                        "text": user_prompt
                    }
                ]
            })
        else:
            messages.append({
                "role": "user",
                "content": user_prompt
            })

        message = client.messages.create(
            model=model,
            max_tokens=max_tokens,
            temperature=0.2,
            system=system_prompt,
            messages=messages
        )
        return message.content[0].text
    except Exception as e:
        print(f"Claude API Error: {str(e)}")
        return f"AI Service Unavailable: {str(e)}"
