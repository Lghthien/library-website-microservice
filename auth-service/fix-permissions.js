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
      { permissionId: 'Q001', permissionName: 'Lập thẻ độc giả', description: 'BM1 - Quyền tạo thẻ độc giả mới', functionGroup: 'READER' },
      { permissionId: 'Q002', permissionName: 'Sửa thông tin độc giả', description: 'Quyền chỉnh sửa thông tin độc giả', functionGroup: 'READER' },
      { permissionId: 'Q003', permissionName: 'Xóa độc giả', description: 'Quyền xóa độc giả', functionGroup: 'READER' },
      { permissionId: 'Q004', permissionName: 'Tra cứu độc giả', description: 'Quyền tra cứu thông tin độc giả', functionGroup: 'READER' },
      { permissionId: 'Q005', permissionName: 'Tiếp nhận sách', description: 'BM2 - Quyền tiếp nhận sách mới', functionGroup: 'BOOK' },
      { permissionId: 'Q006', permissionName: 'Sửa thông tin sách', description: 'Quyền chỉnh sửa thông tin sách', functionGroup: 'BOOK' },
      { permissionId: 'Q007', permissionName: 'Xóa sách', description: 'Quyền xóa sách', functionGroup: 'BOOK' },
      { permissionId: 'Q008', permissionName: 'Tra cứu sách', description: 'BM3 - Quyền tra cứu sách', functionGroup: 'BOOK' },
      { permissionId: 'Q009', permissionName: 'Cho mượn sách', description: 'BM4 - Quyền lập phiếu mượn', functionGroup: 'TRANSACTION' },
      { permissionId: 'Q010', permissionName: 'Nhận trả sách', description: 'BM5 - Quyền nhận trả sách', functionGroup: 'TRANSACTION' },
      { permissionId: 'Q011', permissionName: 'Thu tiền phạt', description: 'BM6 - Quyền lập phiếu thu tiền', functionGroup: 'TRANSACTION' },
      { permissionId: 'Q012', permissionName: 'Xem báo cáo', description: 'BM7 - Quyền xem các báo cáo', functionGroup: 'REPORT' },
      { permissionId: 'Q013', permissionName: 'Xuất báo cáo', description: 'Quyền xuất báo cáo ra file', functionGroup: 'REPORT' },
      { permissionId: 'Q014', permissionName: 'Quản lý người dùng', description: 'Quyền quản lý tài khoản', functionGroup: 'SYSTEM' },
      { permissionId: 'Q015', permissionName: 'Thay đổi quy định', description: 'QĐ8 - Quyền thay đổi tham số hệ thống', functionGroup: 'SYSTEM' },
      { permissionId: 'Q016', permissionName: 'Quản lý thể loại', description: 'Quyền quản lý thể loại sách', functionGroup: 'SYSTEM' },
      { permissionId: 'Q017', permissionName: 'Quản lý tác giả', description: 'Quyền quản lý danh sách tác giả', functionGroup: 'SYSTEM' },
      { permissionId: 'Q018', permissionName: 'Xem nhật ký hệ thống', description: 'Quyền xem audit log', functionGroup: 'SYSTEM' }
    ];

    console.log('Seeding permissions collection...');
    await permissionCollection.deleteMany({});
    await permissionCollection.insertMany(permissionsList);
    console.log(`Successfully seeded ${permissionsList.length} permissions.`);

    console.log('Removing old role-permissions...');
    await rolePermissionCollection.deleteMany({});

    console.log('Granting permissions to roles...');
    
    // ADMIN has ALL
    const adminPermissions = permissionsList.map(p => ({
      role: 'ADMIN',
      permissionId: p.permissionId
    }));

    // LIBRARIAN has subset
    const librarianPermissions = permissionsList
      .filter(p => !['Q014', 'Q015', 'Q016', 'Q017', 'Q018'].includes(p.permissionId))
      .map(p => ({
        role: 'LIBRARIAN',
        permissionId: p.permissionId
      }));

    await rolePermissionCollection.insertMany([...adminPermissions, ...librarianPermissions]);
    console.log(`Successfully granted permissions to ADMIN and LIBRARIAN.`);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

run();
