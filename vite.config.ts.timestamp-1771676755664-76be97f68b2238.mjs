// vite.config.ts
import { defineConfig } from "file:///C:/Users/user/Desktop/Home%20Sighnage/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/user/Desktop/Home%20Sighnage/node_modules/@vitejs/plugin-react/dist/index.js";
import legacy from "file:///C:/Users/user/Desktop/Home%20Sighnage/node_modules/@vitejs/plugin-legacy/dist/index.mjs";
import { execSync } from "child_process";
import { readFileSync } from "fs";
function getVersionInfo() {
  try {
    const packageJson = JSON.parse(readFileSync("./package.json", "utf-8"));
    const version = packageJson.version || "1.0.0";
    let gitHash = "";
    try {
      gitHash = execSync("git rev-parse --short HEAD", { encoding: "utf-8" }).trim();
    } catch (e) {
      gitHash = "unknown";
    }
    const buildDate = (/* @__PURE__ */ new Date()).toISOString();
    return {
      version,
      gitHash,
      buildDate
    };
  } catch (e) {
    return {
      version: "1.0.0",
      gitHash: "unknown",
      buildDate: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
}
var versionInfo = getVersionInfo();
var vite_config_default = defineConfig({
  plugins: [
    react(),
    legacy({
      targets: ["chrome 75"],
      modernPolyfills: true,
      additionalLegacyPolyfills: ["regenerator-runtime/runtime"]
    })
  ],
  define: {
    __APP_VERSION__: JSON.stringify(versionInfo.version),
    __GIT_HASH__: JSON.stringify(versionInfo.gitHash),
    __BUILD_DATE__: JSON.stringify(versionInfo.buildDate)
  },
  server: {
    port: 3e3,
    host: true
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    minify: "terser",
    sourcemap: false,
    // Chrome 75で確実に動作するように設定
    rollupOptions: {
      output: {
        // より互換性の高い形式で出力
        format: "es",
        // チャンクサイズを調整
        manualChunks: void 0
      }
    }
  },
  // 古いブラウザ向けのポリフィルを追加
  optimizeDeps: {
    esbuildOptions: {
      target: "es2015"
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFx1c2VyXFxcXERlc2t0b3BcXFxcSG9tZSBTaWdobmFnZVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcdXNlclxcXFxEZXNrdG9wXFxcXEhvbWUgU2lnaG5hZ2VcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL3VzZXIvRGVza3RvcC9Ib21lJTIwU2lnaG5hZ2Uvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJ1xuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xuaW1wb3J0IGxlZ2FjeSBmcm9tICdAdml0ZWpzL3BsdWdpbi1sZWdhY3knXG5pbXBvcnQgeyBleGVjU3luYyB9IGZyb20gJ2NoaWxkX3Byb2Nlc3MnXG5pbXBvcnQgeyByZWFkRmlsZVN5bmMgfSBmcm9tICdmcydcblxuLy8gXHUzMEQwXHUzMEZDXHUzMEI4XHUzMEU3XHUzMEYzXHU2MEM1XHU1ODMxXHUzMDkyXHU1M0Q2XHU1Rjk3XG5mdW5jdGlvbiBnZXRWZXJzaW9uSW5mbygpIHtcbiAgdHJ5IHtcbiAgICBjb25zdCBwYWNrYWdlSnNvbiA9IEpTT04ucGFyc2UocmVhZEZpbGVTeW5jKCcuL3BhY2thZ2UuanNvbicsICd1dGYtOCcpKVxuICAgIGNvbnN0IHZlcnNpb24gPSBwYWNrYWdlSnNvbi52ZXJzaW9uIHx8ICcxLjAuMCdcbiAgICBcbiAgICAvLyBHaXRcdTMwQjNcdTMwREZcdTMwQzNcdTMwQzhcdTMwQ0ZcdTMwQzNcdTMwQjdcdTMwRTVcdTMwOTJcdTUzRDZcdTVGOTdcdUZGMDhcdTMwQThcdTMwRTlcdTMwRkNcdTY2NDJcdTMwNkZcdTdBN0FcdTY1ODdcdTVCNTdcdUZGMDlcbiAgICBsZXQgZ2l0SGFzaCA9ICcnXG4gICAgdHJ5IHtcbiAgICAgIGdpdEhhc2ggPSBleGVjU3luYygnZ2l0IHJldi1wYXJzZSAtLXNob3J0IEhFQUQnLCB7IGVuY29kaW5nOiAndXRmLTgnIH0pLnRyaW0oKVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGdpdEhhc2ggPSAndW5rbm93bidcbiAgICB9XG4gICAgXG4gICAgLy8gXHUzMEQzXHUzMEVCXHUzMEM5XHU2NUU1XHU2NjQyXG4gICAgY29uc3QgYnVpbGREYXRlID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpXG4gICAgXG4gICAgcmV0dXJuIHtcbiAgICAgIHZlcnNpb24sXG4gICAgICBnaXRIYXNoLFxuICAgICAgYnVpbGREYXRlXG4gICAgfVxuICB9IGNhdGNoIChlKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHZlcnNpb246ICcxLjAuMCcsXG4gICAgICBnaXRIYXNoOiAndW5rbm93bicsXG4gICAgICBidWlsZERhdGU6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKVxuICAgIH1cbiAgfVxufVxuXG5jb25zdCB2ZXJzaW9uSW5mbyA9IGdldFZlcnNpb25JbmZvKClcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW1xuICAgIHJlYWN0KCksXG4gICAgbGVnYWN5KHtcbiAgICAgIHRhcmdldHM6IFsnY2hyb21lIDc1J10sXG4gICAgICBtb2Rlcm5Qb2x5ZmlsbHM6IHRydWUsXG4gICAgICBhZGRpdGlvbmFsTGVnYWN5UG9seWZpbGxzOiBbJ3JlZ2VuZXJhdG9yLXJ1bnRpbWUvcnVudGltZSddXG4gICAgfSlcbiAgXSxcbiAgZGVmaW5lOiB7XG4gICAgX19BUFBfVkVSU0lPTl9fOiBKU09OLnN0cmluZ2lmeSh2ZXJzaW9uSW5mby52ZXJzaW9uKSxcbiAgICBfX0dJVF9IQVNIX186IEpTT04uc3RyaW5naWZ5KHZlcnNpb25JbmZvLmdpdEhhc2gpLFxuICAgIF9fQlVJTERfREFURV9fOiBKU09OLnN0cmluZ2lmeSh2ZXJzaW9uSW5mby5idWlsZERhdGUpXG4gIH0sXG4gIHNlcnZlcjoge1xuICAgIHBvcnQ6IDMwMDAsXG4gICAgaG9zdDogdHJ1ZVxuICB9LFxuICBidWlsZDoge1xuICAgIG91dERpcjogJ2Rpc3QnLFxuICAgIGFzc2V0c0RpcjogJ2Fzc2V0cycsXG4gICAgbWluaWZ5OiAndGVyc2VyJyxcbiAgICBzb3VyY2VtYXA6IGZhbHNlLFxuICAgIC8vIENocm9tZSA3NVx1MzA2N1x1NzhCQVx1NUI5Rlx1MzA2Qlx1NTJENVx1NEY1Q1x1MzA1OVx1MzA4Qlx1MzA4OFx1MzA0Nlx1MzA2Qlx1OEEyRFx1NUI5QVxuICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgIG91dHB1dDoge1xuICAgICAgICAvLyBcdTMwODhcdTMwOEFcdTRFOTJcdTYzREJcdTYwMjdcdTMwNkVcdTlBRDhcdTMwNDRcdTVGNjJcdTVGMEZcdTMwNjdcdTUxRkFcdTUyOUJcbiAgICAgICAgZm9ybWF0OiAnZXMnLFxuICAgICAgICAvLyBcdTMwQzFcdTMwRTNcdTMwRjNcdTMwQUZcdTMwQjVcdTMwQTRcdTMwQkFcdTMwOTJcdThBQkZcdTY1NzRcbiAgICAgICAgbWFudWFsQ2h1bmtzOiB1bmRlZmluZWRcbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIC8vIFx1NTNFNFx1MzA0NFx1MzBENlx1MzBFOVx1MzBBNlx1MzBCNlx1NTQxMVx1MzA1MVx1MzA2RVx1MzBERFx1MzBFQVx1MzBENVx1MzBBM1x1MzBFQlx1MzA5Mlx1OEZGRFx1NTJBMFxuICBvcHRpbWl6ZURlcHM6IHtcbiAgICBlc2J1aWxkT3B0aW9uczoge1xuICAgICAgdGFyZ2V0OiAnZXMyMDE1J1xuICAgIH1cbiAgfVxufSlcblxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUF1UyxTQUFTLG9CQUFvQjtBQUNwVSxPQUFPLFdBQVc7QUFDbEIsT0FBTyxZQUFZO0FBQ25CLFNBQVMsZ0JBQWdCO0FBQ3pCLFNBQVMsb0JBQW9CO0FBRzdCLFNBQVMsaUJBQWlCO0FBQ3hCLE1BQUk7QUFDRixVQUFNLGNBQWMsS0FBSyxNQUFNLGFBQWEsa0JBQWtCLE9BQU8sQ0FBQztBQUN0RSxVQUFNLFVBQVUsWUFBWSxXQUFXO0FBR3ZDLFFBQUksVUFBVTtBQUNkLFFBQUk7QUFDRixnQkFBVSxTQUFTLDhCQUE4QixFQUFFLFVBQVUsUUFBUSxDQUFDLEVBQUUsS0FBSztBQUFBLElBQy9FLFNBQVMsR0FBRztBQUNWLGdCQUFVO0FBQUEsSUFDWjtBQUdBLFVBQU0sYUFBWSxvQkFBSSxLQUFLLEdBQUUsWUFBWTtBQUV6QyxXQUFPO0FBQUEsTUFDTDtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDRjtBQUFBLEVBQ0YsU0FBUyxHQUFHO0FBQ1YsV0FBTztBQUFBLE1BQ0wsU0FBUztBQUFBLE1BQ1QsU0FBUztBQUFBLE1BQ1QsWUFBVyxvQkFBSSxLQUFLLEdBQUUsWUFBWTtBQUFBLElBQ3BDO0FBQUEsRUFDRjtBQUNGO0FBRUEsSUFBTSxjQUFjLGVBQWU7QUFFbkMsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUztBQUFBLElBQ1AsTUFBTTtBQUFBLElBQ04sT0FBTztBQUFBLE1BQ0wsU0FBUyxDQUFDLFdBQVc7QUFBQSxNQUNyQixpQkFBaUI7QUFBQSxNQUNqQiwyQkFBMkIsQ0FBQyw2QkFBNkI7QUFBQSxJQUMzRCxDQUFDO0FBQUEsRUFDSDtBQUFBLEVBQ0EsUUFBUTtBQUFBLElBQ04saUJBQWlCLEtBQUssVUFBVSxZQUFZLE9BQU87QUFBQSxJQUNuRCxjQUFjLEtBQUssVUFBVSxZQUFZLE9BQU87QUFBQSxJQUNoRCxnQkFBZ0IsS0FBSyxVQUFVLFlBQVksU0FBUztBQUFBLEVBQ3REO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsRUFDUjtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0wsUUFBUTtBQUFBLElBQ1IsV0FBVztBQUFBLElBQ1gsUUFBUTtBQUFBLElBQ1IsV0FBVztBQUFBO0FBQUEsSUFFWCxlQUFlO0FBQUEsTUFDYixRQUFRO0FBQUE7QUFBQSxRQUVOLFFBQVE7QUFBQTtBQUFBLFFBRVIsY0FBYztBQUFBLE1BQ2hCO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQTtBQUFBLEVBRUEsY0FBYztBQUFBLElBQ1osZ0JBQWdCO0FBQUEsTUFDZCxRQUFRO0FBQUEsSUFDVjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
