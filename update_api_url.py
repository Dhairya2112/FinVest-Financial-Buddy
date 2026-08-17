import os
import re

directory = r"m:\finvest\frontend\src"
pattern = re.compile(r'"http://localhost:5000(/api/[^"]*)"')

for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith((".js", ".jsx")):
            filepath = os.path.join(root, file)
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()
            
            if '"http://localhost:5000' in content:
                new_content = pattern.sub(r'(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000") + "\1"', content)
                with open(filepath, "w", encoding="utf-8") as f:
                    f.write(new_content)
                print(f"Updated {filepath}")
