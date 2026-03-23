export const httpTools = {
  http_request: {
    schema: {
      name: 'http_request',
      description: 'Make an HTTP request to an API',
      parameters: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'URL to request'
          },
          method: {
            type: 'string',
            enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
            description: 'HTTP method'
          },
          headers: {
            type: 'object',
            description: 'HTTP headers (optional)'
          },
          body: {
            type: 'string',
            description: 'Request body for POST/PUT/PATCH (optional)'
          }
        },
        required: ['url', 'method']
      }
    },
    async execute({ url, method, headers = {}, body }) {
      try {
        const options = {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...headers
          }
        };

        if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
          options.body = body;
        }

        const response = await fetch(url, options);
        const responseText = await response.text();
        
        let responseBody;
        try {
          responseBody = JSON.parse(responseText);
        } catch {
          responseBody = responseText;
        }

        return {
          success: true,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: responseBody
        };
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    }
  }
};
