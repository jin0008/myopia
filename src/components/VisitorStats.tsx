// myopia/src/components/VisitorStats.tsx
useEffect(() => {
  fetch('/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: window.location.pathname }),
  }).then(r => r.json()).then(setStats);
}, []);
