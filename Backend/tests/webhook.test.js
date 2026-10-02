
beforeAll(async () => {
  try {
    const url = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/eve_assignment';
    console.log("Bina error ke DB connect ho raha hai is URL par:", url);
    
    await mongoose.connect(url);
    console.log("✅ DB Connected Successfully for Testing!");
    
  } catch (err) {
    console.error("❌ DB CONNECTION FAILED. Asli Error yeh hai:", err.message);
  }
});