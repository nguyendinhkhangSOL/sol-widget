import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Inline CSS vào JS bundle ở chế độ embed — chỉ cần ship 1 file `sol-widget.js`
 * thay vì cả `.js` + `.css`. Khi widget load, plugin này tự inject <style> vào
 * <head>. Cần cho mode embed (partner site / dashboard) — host không phải biết
 * load thêm stylesheet riêng.
 */
function inlineCssPlugin(): Plugin {
  return {
    name: 'inline-css-into-js',
    apply: 'build',
    enforce: 'post',
    generateBundle(_options, bundle) {
      // Tìm CSS asset
      let cssText = '';
      for (const fileName of Object.keys(bundle)) {
        const file = bundle[fileName];
        if (file.type === 'asset' && fileName.endsWith('.css')) {
          cssText = typeof file.source === 'string'
            ? file.source
            : Buffer.from(file.source).toString('utf-8');
          // Xoá CSS file output — không cần ship riêng
          delete bundle[fileName];
        }
      }
      if (!cssText) return;

      // Tìm JS chunk + prepend đoạn inject style
      for (const fileName of Object.keys(bundle)) {
        const file = bundle[fileName];
        if (file.type === 'chunk' && fileName.endsWith('.js')) {
          const escaped = JSON.stringify(cssText);
          const inject =
            `(function(){if(typeof document==="undefined")return;var s=document.createElement("style");s.id="sol-widget-styles";s.textContent=${escaped};document.head.appendChild(s);})();`;
          file.code = inject + file.code;
        }
      }
    },
  };
}

export default defineConfig(({ mode }) => {
  if (mode === 'embed') {
    // Build embeddable IIFE bundle: <script src="/sol-widget.js"></script>
    return {
      plugins: [react(), inlineCssPlugin()],
      // Stub process.env cho browser — React production build reference
      // process.env.NODE_ENV. IIFE bundle không có process global như Node →
      // bind compile-time value để tránh ReferenceError runtime.
      define: {
        'process.env.NODE_ENV': '"production"',
        'process.env': '{}',
      },
      build: {
        lib: {
          entry: 'src/embed.ts',
          name: 'SOLWidget',
          formats: ['iife'],
          fileName: () => 'sol-widget.js',
        },
        rollupOptions: {
          output: { extend: true, inlineDynamicImports: true },
        },
        cssCodeSplit: false,
      },
    };
  }
  return {
    plugins: [react()],
    server: { port: 5173 },
  };
});
