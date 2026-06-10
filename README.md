# Real Estate Rundown Top 10 Renderer

Deploy this folder as its own Render Web Service. It does not replace your working news renderer.

Endpoints:
- GET `/health`
- POST `/render/top10` returns a PNG
- POST `/render/top10/html` returns debug HTML

Render settings:
- Runtime: Node
- Build command: `npm install`
- Start command: `npm start`

After deploying, open the n8n workflow and replace the URL in **Render Top 10 Template** with:

```txt
https://YOUR-SERVICE.onrender.com/render/top10
```