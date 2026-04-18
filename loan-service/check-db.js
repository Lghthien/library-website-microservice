const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const loans = await mongoose.connection.collection('loans').find({}).toArray();
    console.log('Loans count:', loans.length);
    process.exit(0);
}).catch(console.error);
