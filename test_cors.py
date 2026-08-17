import requests

url = "https://finvest-7gu9.onrender.com/api/auth/request-otp"
headers = {
    "Origin": "https://finvest-financial-buddy.vercel.app",
    "Access-Control-Request-Method": "POST",
    "Access-Control-Request-Headers": "Content-Type"
}

response = requests.options(url, headers=headers)
print("OPTIONS status:", response.status_code)
print("OPTIONS headers:", response.headers)

# Test actual POST
response = requests.post(url, json={"email": "test@gmail.com", "type": "login"})
print("POST status:", response.status_code)
print("POST headers:", response.headers)
print("POST content:", response.text)
