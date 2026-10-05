fetch('http://localhost:8787/api/reviews', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ code: "const a = 1;", language: "javascript" })
}).then(res => res.json()).then(console.log).catch(console.error);
