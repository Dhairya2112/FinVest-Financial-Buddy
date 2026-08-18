import os

target = '(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000")'
replacement = '(process.env.NEXT_PUBLIC_API_URL || "https://finvest-7gu9.onrender.com")'

for root, dirs, files in os.walk('frontend/src'):
    for file in files:
        if file.endswith('.js') or file.endswith('.jsx'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            if target in content:
                content = content.replace(target, replacement)
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f'Updated {filepath}')
