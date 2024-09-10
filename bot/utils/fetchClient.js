const HttpsProxyAgent = require('https-proxy-agent');
DO_DEBUG = false;

class FetchClient {
    constructor(options = {}) {
        this.defaults = { headers: options.headers || {} }
        this.withCredentials = options.withCredentials || false;
        this.proxy = options.proxy || null; // Store proxy configuration
    }

    async request(url, method, body = null, headers = {}) {
        try {
            // console.log(`Requesting ${url} with method ${method} and body ${JSON.stringify(body)} and headers ${JSON.stringify(this.defaults.headers)}`);
            // Create agent if proxy is provided
            const agent = this.proxy ? new HttpsProxyAgent(this.proxy) : undefined;

            const response = await fetch(url, {
                method,
                headers: { ...this.defaults.headers, ...headers },
                body: body ? body : null,
                credentials: this.withCredentials ? 'include' : 'same-origin',
                agent // Attach agent if proxy is set
            });

            // Check if the response is not ok
            if (!response.ok) {
                // Try to parse the response as JSON
                const errorText = await response.text();
                // Create an error with additional information
                const error = new Error(`HTTP error! Status: ${response.status}`);
                error.status = response.status;
                error.url = url;
                error.method = method;
                error.responseText = errorText;
                error.response = { data: JSON.parse(errorText) };
                // Throw the error with additional information
                throw error;
            }

            // Return the parsed JSON response
            return { data: await response.json(), status: response.status };
        } catch (error) {
            // Enhanced error logging with additional details
            if (DO_DEBUG) {
                console.error(`Request failed:
              URL: ${error.url}
              Method: ${error.method}
              Status: ${error.status}
              Response Text: ${error.responseText}
              Error: ${error.message}
            `);
            }
            // Rethrow the error for further handling if needed
            throw error;
        }
    }

    get(url, headers = {}) {
        return this.request(url, 'GET', null, headers);
    }

    post(url, body = {}, headers = {}) {
        return this.request(url, 'POST', body, headers);
    }

    put(url, body = {}, headers = {}) {
        return this.request(url, 'PUT', body, headers);
    }

    delete(url, headers = {}) {
        return this.request(url, 'DELETE', null, headers);
    }
}

module.exports = FetchClient;
