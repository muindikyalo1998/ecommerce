const ngrok = require('@ngrok/ngrok');

(async function () {
  try {
    console.log("🚀 Starting ngrok tunnel...");
    const url = await ngrok.connect({
      addr: 5000,
      authtoken: "35puXi2Gpzk8qUyIz2CDSK09nzy_6YPtoZJq9Hps9ygyKLU7X"
    });
    console.log("🎉 Ngrok tunnel active at:", url);
    console.log("📞 Public URL:", url);
    console.log("⚠️ Keep this running — Safaricom will call this URL.");
    process.stdin.resume(); // keep alive
  } catch (error) {
    console.error("❌ Ngrok tunnel failed:", error);
  }
})();
