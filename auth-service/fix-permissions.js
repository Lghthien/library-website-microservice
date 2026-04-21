/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

async function run() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    const db = mongoose.connection.useDb('library');

    const rolePermissionCollection = db.collection('rolepermissions');
    const permissionCollection = db.collection('permissions');

    const permissionsList = [
      {
        permissionId: 'Q001',
        permissionName: 'Láº­p tháº» Ä‘á»™c giáº£',
        description: 'BM1 - Quyá»n táº¡o tháº» Ä‘á»™c giáº£ má»›i',
        functionGroup: 'READER',
      },
      {
        permissionId: 'Q002',
        permissionName: 'Sá»­a thÃ´ng tin Ä‘á»™c giáº£',
        description: 'Quyá»n chá»‰nh sá»­a thÃ´ng tin Ä‘á»™c giáº£',
        functionGroup: 'READER',
      },
      {
        permissionId: 'Q003',
        permissionName: 'XÃ³a Ä‘á»™c giáº£',
        description: 'Quyá»n xÃ³a Ä‘á»™c giáº£',
        functionGroup: 'READER',
      },
      {
        permissionId: 'Q004',
        permissionName: 'Tra cá»©u Ä‘á»™c giáº£',
        description: 'Quyá»n tra cá»©u thÃ´ng tin Ä‘á»™c giáº£',
        functionGroup: 'READER',
      },
      {
        permissionId: 'Q005',
        permissionName: 'Tiáº¿p nháº­n sÃ¡ch',
        description: 'BM2 - Quyá»n tiáº¿p nháº­n sÃ¡ch má»›i',
        functionGroup: 'BOOK',
      },
      {
        permissionId: 'Q006',
        permissionName: 'Sá»­a thÃ´ng tin sÃ¡ch',
        description: 'Quyá»n chá»‰nh sá»­a thÃ´ng tin sÃ¡ch',
        functionGroup: 'BOOK',
      },
      {
        permissionId: 'Q007',
        permissionName: 'XÃ³a sÃ¡ch',
        description: 'Quyá»n xÃ³a sÃ¡ch',
        functionGroup: 'BOOK',
      },
      {
        permissionId: 'Q008',
        permissionName: 'Tra cá»©u sÃ¡ch',
        description: 'BM3 - Quyá»n tra cá»©u sÃ¡ch',
        functionGroup: 'BOOK',
      },
      {
        permissionId: 'Q009',
        permissionName: 'Cho mÆ°á»£n sÃ¡ch',
        description: 'BM4 - Quyá»n láº­p phiáº¿u mÆ°á»£n',
        functionGroup: 'TRANSACTION',
      },
      {
        permissionId: 'Q010',
        permissionName: 'Nháº­n tráº£ sÃ¡ch',
        description: 'BM5 - Quyá»n nháº­n tráº£ sÃ¡ch',
        functionGroup: 'TRANSACTION',
      },
      {
        permissionId: 'Q011',
        permissionName: 'Thu tiá»n pháº¡t',
        description: 'BM6 - Quyá»n láº­p phiáº¿u thu tiá»n',
        functionGroup: 'TRANSACTION',
      },
      {
        permissionId: 'Q012',
        permissionName: 'Xem bÃ¡o cÃ¡o',
        description: 'BM7 - Quyá»n xem cÃ¡c bÃ¡o cÃ¡o',
        functionGroup: 'REPORT',
      },
      {
        permissionId: 'Q013',
        permissionName: 'Xuáº¥t bÃ¡o cÃ¡o',
        description: 'Quyá»n xuáº¥t bÃ¡o cÃ¡o ra file',
        functionGroup: 'REPORT',
      },
      {
        permissionId: 'Q014',
        permissionName: 'Quáº£n lÃ½ ngÆ°á»i dÃ¹ng',
        description: 'Quyá»n quáº£n lÃ½ tÃ i khoáº£n',
        functionGroup: 'SYSTEM',
      },
      {
        permissionId: 'Q015',
        permissionName: 'Thay Ä‘á»•i quy Ä‘á»‹nh',
        description: 'QÄ8 - Quyá»n thay Ä‘á»•i tham sá»‘ há»‡ thá»‘ng',
        functionGroup: 'SYSTEM',
      },
      {
        permissionId: 'Q016',
        permissionName: 'Quáº£n lÃ½ thá»ƒ loáº¡i',
        description: 'Quyá»n quáº£n lÃ½ thá»ƒ loáº¡i sÃ¡ch',
        functionGroup: 'SYSTEM',
      },
      {
        permissionId: 'Q017',
        permissionName: 'Quáº£n lÃ½ tÃ¡c giáº£',
        description: 'Quyá»n quáº£n lÃ½ danh sÃ¡ch tÃ¡c giáº£',
        functionGroup: 'SYSTEM',
      },
      {
        permissionId: 'Q018',
        permissionName: 'Xem nháº­t kÃ½ há»‡ thá»‘ng',
        description: 'Quyá»n xem audit log',
        functionGroup: 'SYSTEM',
      },
    ];

    console.log('Seeding permissions collection...');
    await permissionCollection.deleteMany({});
    await permissionCollection.insertMany(permissionsList);
    console.log(`Successfully seeded ${permissionsList.length} permissions.`);

    console.log('Removing old role-permissions...');
    await rolePermissionCollection.deleteMany({});

    console.log('Granting permissions to roles...');

    // ADMIN has ALL
    const adminPermissions = permissionsList.map((p) => ({
      role: 'ADMIN',
      permissionId: p.permissionId,
    }));

    // LIBRARIAN has subset
    const librarianPermissions = permissionsList
      .filter(
        (p) =>
          !['Q014', 'Q015', 'Q016', 'Q017', 'Q018'].includes(p.permissionId),
      )
      .map((p) => ({
        role: 'LIBRARIAN',
        permissionId: p.permissionId,
      }));

    await rolePermissionCollection.insertMany([
      ...adminPermissions,
      ...librarianPermissions,
    ]);
    console.log(`Successfully granted permissions to ADMIN and LIBRARIAN.`);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

run();
