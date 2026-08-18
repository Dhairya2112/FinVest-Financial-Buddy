from flask import Blueprint, request, jsonify
from auth_middleware import token_required
import os
import google.generativeai as genai
from PIL import Image
import io
import json

splitter_bp = Blueprint('splitter', __name__)

@splitter_bp.route('/upload', methods=['POST'])
@token_required
def upload_receipt(current_user):
    try:
        if 'receipt' not in request.files:
            return jsonify({'status': 'error', 'message': 'No image provided.'}), 400
            
        file = request.files['receipt']
        
        if file.filename == '':
            return jsonify({'status': 'error', 'message': 'Empty file provided.'}), 400

        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            return jsonify({'status': 'error', 'message': 'GEMINI_API_KEY not configured in backend.'}), 500

        # Configure Gemini
        genai.configure(api_key=api_key)
        
        # Open image from bytes
        image = Image.open(io.BytesIO(file.read()))
        
        # We use gemini-3.5-flash because it's fast and supports multimodal (vision)
        model = genai.GenerativeModel("gemini-3.5-flash")
        
        prompt = """
        You are a highly accurate receipt parsing AI. 
        Extract all the items and their prices from this receipt. 
        
        CRITICAL RULE FOR QUANTITIES:
        You MUST extract the exact quantity of each item. If an item says '4 Chinese Buffet $51.96', you must return "qty": 4, and "total_price": 51.96.
        
        Also extract the 'tax', 'tip', and 'total' if visible (if not visible, return 0).
        Return ONLY a raw JSON object, with no markdown formatting and no code blocks.
        Format: 
        {
            "items": [{"item": "Chinese Buffet", "qty": 4, "total_price": 51.96}, {"item": "Fries", "qty": 1, "total_price": 4.00}],
            "tax": 1.50,
            "tip": 2.00,
            "total": 20.00
        }
        """
        
        response = model.generate_content([prompt, image])
        
        import re
        text_response = response.text.strip()
        
        # Robustly extract JSON using regex in case the LLM adds conversational text
        json_match = re.search(r'\{.*\}', text_response, re.DOTALL)
        if json_match:
            text_response = json_match.group(0)
            
        try:
            data = json.loads(text_response.strip())
        except json.JSONDecodeError:
            print("Failed to parse JSON:", text_response)
            return jsonify({'status': 'error', 'message': 'Failed to parse receipt correctly.'}), 500
            
        return jsonify({
            'status': 'success',
            'data': data
        }), 200

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'status': 'error', 'message': f'Internal Error: {str(e)}'}), 500

@splitter_bp.route('/distribute', methods=['POST'])
@token_required
def distribute_split(current_user):
    try:
        req_data = request.json
        receipt_data = req_data.get('receipt_data')
        user_prompt = req_data.get('prompt')

        if not receipt_data or not user_prompt:
            return jsonify({'status': 'error', 'message': 'Missing data or prompt.'}), 400

        api_key = os.getenv("GEMINI_API_KEY")
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-3.5-flash")

        system_prompt = f"""
        You are a tactical financial distribution AI. You calculate exact bill splits based on natural language.
        
        RECEIPT DATA:
        {json.dumps(receipt_data)}
        
        USER INSTRUCTIONS:
        "{user_prompt}"
        
        RULES:
        1. FIRST, check if the USER INSTRUCTIONS are related to splitting the bill, people, items, food, or paying. If the user asks a completely unrelated question (like "what is your model", "tell me a joke", "write code"), DO NOT process the bill. Instead, return EXACTLY this JSON: {{"error": "I am a tactical distribution AI. I cannot help you with anything other than distributing this bill."}}
        2. Parse the user's natural language to figure out exactly who ate what. ("I" or "my" = "Me").
        3. Handle fractional splits perfectly (e.g. "I ate half the burger, John ate the other half").
        4. If any item is completely unmentioned by the user, split its cost equally among all identified people.
        5. Tax and Tip MUST be split EQUALLY among all identified people, regardless of how much food they ate.
        6. Return a strict JSON response representing the final breakdown. Do not include markdown codeblocks.
        
        OUTPUT FORMAT (JSON ONLY):
        {{
            "operators": ["Me", "John", "Alice"],
            "breakdown": {{
                "Me": {{
                    "items_detail": ["Half Burger ($6.25)"],
                    "items_cost": 6.25,
                    "tax": 0.50,
                    "tip": 1.00,
                    "total_owed": 7.75
                }},
                "John": {{ ... }}
            }}
        }}
        """

        response = model.generate_content(system_prompt)
        import re
        text_response = response.text.strip()
        
        json_match = re.search(r'\{.*\}', text_response, re.DOTALL)
        if json_match:
            text_response = json_match.group(0)

        distribution = json.loads(text_response)

        if "error" in distribution:
            return jsonify({'status': 'error', 'message': distribution['error']}), 400

        return jsonify({
            'status': 'success',
            'data': distribution
        }), 200

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'status': 'error', 'message': f'Internal Error: {str(e)}'}), 500
