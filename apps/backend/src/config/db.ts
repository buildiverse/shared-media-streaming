import mongoose from "mongoose";

export const connectDB = async () => {
  console.log("🔍 Debug - Environment variables:");
  console.log("MONGO_URI:", process.env.MONGO_URI);
  console.log("PORT:", process.env.PORT);
  
  if (!process.env.MONGO_URI) {
    console.error("❌ MONGO_URI is not defined in environment variables");
    console.error("💡 Make sure your .env file is in the correct location and contains MONGO_URI");
    process.exit(1);
  }

  try {
    console.log(`🔄 Connecting to MongoDB...`);
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log("✅ MongoDB connected successfully");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
};
