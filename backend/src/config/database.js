import mongoose from "mongoose";

const connectDB = async () => {
  try {
    // Simple fix: disable buffering to prevent timeout errors
    const options = {
      maxPoolSize: 10, 
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000, 
      retryWrites: true,
      w: 'majority'
    };

    const conn = await mongoose.connect(process.env.MONGODB_URI, options);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB Connection Error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB Disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB Reconnected');
    });

  } catch (error) {
    console.error('❌ MongoDB Connection Failed:');
    console.error('   Error:', error.message);      
  
    process.exit(1);
  }
};

export default connectDB;
