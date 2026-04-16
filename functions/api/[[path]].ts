export const onRequest: PagesFunction = async (context) => {
  const { request, params } = context;
  const url = new URL(request.url);
  
  // Extract the path after /api/
  const path = (params.path as string[] || []).join('/');
  
  // Construct the target URL (Render backend)
  const targetUrl = `https://smartmovebackend-eogl.onrender.com/api/${path}${url.search}`;
  
  // Create a new request to forward
  const newRequest = new Request(targetUrl, {
    method: request.method,
    headers: request.headers,
    body: request.body,
    redirect: 'manual'
  });

  try {
    const response = await fetch(newRequest);
    
    // Create a new response to handle CORS and other headers
    // We clone the response to modify headers if needed
    const newResponse = new Response(response.body, response);
    
    // Ensure the origin is allowed (optional but good for robustness)
    // newResponse.headers.set('Access-Control-Allow-Origin', '*');
    
    return newResponse;
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Proxy request failed', details: err.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
