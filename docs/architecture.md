# Understanding FinVest 2.0 Architecture

This document teaches you how our modernized, decoupled application architecture works.

## What is a Decoupled Architecture?
Historically, FinVest was a **Monolith**. The Python backend handled the database logic AND generated the HTML pages (using Jinja2 templates like `render_template('dashboard.html')`). This was slow, rigid, and made it impossible to build mobile apps.

Now, FinVest is **Decoupled**:
1. **The Backend (Flask + Supabase API):** Only cares about data. It accepts requests, talks to the cloud database, processes encryption, and returns raw JSON data.
2. **The Frontend (Next.js/React):** Only cares about visuals. It asks the backend for data, and then uses Framer Motion and Tailwind to render the UI smoothly.

## How the API Endpoints Work

An API (Application Programming Interface) is essentially a digital menu. The Frontend places an "order" (Request), and the Backend cooks the food and brings it back (Response).

### 1. The Request (Frontend)
When you click "Log Transaction" in Next.js, the `fetch` function makes an HTTP Request to the Python server.
```javascript
const res = await fetch("http://localhost:5000/api/transactions/add", {
  method: "POST", // POST means "I am giving you new data to save"
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ amount: 100, category: "Food" }) // The payload
});
```

### 2. The Route Handler (Backend)
The Flask server is listening. It sees a request coming into `/api/transactions/add`.
```python
@tracker_bp.route('/api/transactions/add', methods=['POST'])
def add_transaction():
    data = request.json            # Flask extracts the JSON payload
    amount = data.get('amount')    # amount = 100
```

### 3. The Repository Layer (Database Access)
Flask doesn't talk to the database directly in the route. It passes the data to the **Repository**, a dedicated class that handles all Supabase interactions. This is where your encryption happens.
```python
# Inside transaction_repository.py
supabase_db.table("transactions").insert({
    "amount": DataCipher.encrypt(amount) # Secures the data
}).execute()
```

### 4. The Response
Finally, the Backend sends a JSON receipt back to the Frontend.
```json
{
  "status": "success",
  "message": "Transaction added successfully",
  "data": { "id": 5, "amount": 100 }
}
```
The Frontend sees `"status": "success"` and updates the Dashboard UI immediately without having to refresh the entire browser page!

## The Data Flow Summary
`User Action (Click)` -> `Next.js (fetch)` -> `Flask Route (/api/...)` -> `Repository Layer (Encryption)` -> `Supabase (PostgreSQL Cloud)`
