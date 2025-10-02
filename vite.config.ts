import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import * as fs from 'fs';
import * as path from 'path';

// Function to load .env.local manually
function loadLocalEnv() {
  try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const envVars: Record<string, string> = {};

      envContent.split('\n').forEach(line => {
        const match = line.match(/^([^#][^=]*?)=(.*)$/);
        if (match) {
          const [, key, value] = match;
          envVars[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
        }
      });

      return envVars;
    }
  } catch (error) {
    console.warn('Could not load .env.local:', error);
  }
  return {};
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ''), ...loadLocalEnv() };

  console.log('🔧 Proxy Configuration:');
  console.log('- FAL Key available:', !!(env.VITE_FAL_KEY || env.FAL_KEY));
  console.log('- FASHN Key available:', !!(env.VITE_FASHN_API_KEY || env.FASHN_API_KEY));
  console.log('- Claude Key available:', !!(env.VITE_CLAUDE_API_KEY || env.VITE_ANTHROPIC_API_KEY || env.CLAUDE_API_KEY || env.ANTHROPIC_API_KEY));
  console.log('- Perplexity Key available:', !!(env.VITE_PERPLEXITY_API_KEY || env.PERPLEXITY_API_KEY));

  return {
    plugins: [react()],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    server: {
      proxy: {
        '/api/fal': {
          target: 'https://fal.run',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/api\/fal\//, '/'),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq, req, res) => {
              const falKey = env.VITE_FAL_KEY || env.FAL_KEY;
              console.log('🎨 [FAL-PROXY] Request Details:', {
                originalPath: req.url,
                rewrittenPath: proxyReq.path,
                target: 'https://fal.run',
                method: proxyReq.method,
                hasKey: !!falKey,
                keyPreview: falKey ? falKey.substring(0, 20) + '...' : 'none'
              });
              if (falKey) {
                proxyReq.setHeader('Authorization', `Key ${falKey}`);
                proxyReq.setHeader('Content-Type', 'application/json');
              } else {
                console.error('❌ [FAL-PROXY] No FAL API key found!');
              }
            });
            proxy.on('proxyRes', (proxyRes, req, res) => {
              console.log('📨 [FAL-PROXY] Response:', {
                status: proxyRes.statusCode,
                statusMessage: proxyRes.statusMessage,
                headers: Object.keys(proxyRes.headers)
              });
            });
            proxy.on('error', (err, req, res) => {
              console.error('❌ [FAL-PROXY] Proxy error:', err);
            });
          },
        },
        '/api/claude': {
          target: 'https://api.anthropic.com',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/api\/claude/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq, req, res) => {
              const claudeKey = env.VITE_CLAUDE_API_KEY || env.VITE_ANTHROPIC_API_KEY || env.CLAUDE_API_KEY || env.ANTHROPIC_API_KEY;
              console.log('🤖 Claude Proxy Request:', proxyReq.path, 'Key available:', !!claudeKey);
              if (claudeKey) {
                proxyReq.setHeader('X-API-Key', claudeKey);
                proxyReq.setHeader('anthropic-version', '2023-06-01');
                proxyReq.setHeader('anthropic-dangerous-direct-browser-access', 'true');
              }
            });
          },
        },
        '/api/perplexity': {
          target: 'https://api.perplexity.ai',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/api\/perplexity/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq, req, res) => {
              const perplexityKey = env.VITE_PERPLEXITY_API_KEY || env.PERPLEXITY_API_KEY;
              console.log('🔍 Perplexity Proxy Request:', proxyReq.path, 'Key available:', !!perplexityKey);
              if (perplexityKey) {
                proxyReq.setHeader('Authorization', `Bearer ${perplexityKey}`);
                proxyReq.setHeader('Content-Type', 'application/json');
              }
            });
          },
        },
      },
    },
  };
});
