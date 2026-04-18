const mongoose = require('mongoose');

const uri = 'mongodb://localhost:27017/library';

async function fixParameter() {
  try {
    await mongoose.connect(uri);
    const db = mongoose.connection.db;
    
    // Update QD_FINE_PER_DAY to 1000
    await db.collection('parameters').updateOne(
      { paramName: 'QD_FINE_PER_DAY' },
      { $set: { paramValue: '1000' } },
      { upsert: true }
    );
    
    // Remove QD8_FINE_PER_DAY if exists
    await db.collection('parameters').deleteOne({ paramName: 'QD8_FINE_PER_DAY' });
    
    // Verify
    const qd = await db.collection('parameters').findOne({ paramName: 'QD_FINE_PER_DAY' });
    console.log('✅ QD_FINE_PER_DAY:', qd?.paramValue, 'VND/ngày');
    console.log('✅ QD8_FINE_PER_DAY đã xóa (không sử dụng)');
    console.log('\n📋 Tất cả tính toán phạt sẽ dùng QD_FINE_PER_DAY');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Lỗi:', err);
    process.exit(1);
  }
}

fixParameter();
