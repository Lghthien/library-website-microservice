const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const books = await mongoose.connection.collection('books').find({}).toArray();
    console.log('Books count:', books.length);
    process.exit(0);
}).catch(console.error);
