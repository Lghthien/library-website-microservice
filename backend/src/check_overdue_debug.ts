import * as mongoose from 'mongoose';

async function main() {
  const MONGO_URI = 'mongodb://localhost:27017/library'; // Default
  console.log(`Connecting to ${MONGO_URI}...`);
  
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected.');
    
    // Access collections directly
    const db = mongoose.connection.db;
    if (!db) throw new Error('DB connection failed');

    const parameters = db.collection('parameters');
    const loans = db.collection('loans');
    const loanDetails = db.collection('loandetails');

    // 1. Check Parameter
    console.log('\n--- checking QD4_MAX_BORROW_DAYS ---');
    const paramQD4 = await parameters.findOne({ paramName: 'QD4_MAX_BORROW_DAYS' });
    console.log('QD4_MAX_BORROW_DAYS from DB:', paramQD4);
    
    const maxDays = paramQD4 ? parseInt(paramQD4.paramValue) : 4;
    console.log('Using maxDays:', maxDays);

    // 2. Check Overdue Loans Count (Manual Calculation)
    console.log('\n--- Checking Overdue Loans (Raw Aggregation) ---');
    const now = new Date();
    
    // Simple check: Find any loan detail not returned
    const notReturnedCount = await loanDetails.countDocuments({ returnDate: null });
    console.log('Total loan details with returnDate = null:', notReturnedCount);

    // Full pipeline check similar to service
    const pipeline = [
      {
        $lookup: {
          from: 'loandetails',
          localField: '_id',
          foreignField: 'loanId',
          as: 'loanDetail',
        },
      },
      { $unwind: '$loanDetail' },
      {
        $match: {
          'loanDetail.returnDate': null, // Not yet returned
        },
      },
      {
        $addFields: {
          dueDate: {
            $add: ['$borrowDate', maxDays * 24 * 60 * 60 * 1000],
          },
        },
      },
      {
        $match: {
          dueDate: { $lt: now },
        },
      },
      {
          $project: {
              _id: 1,
              borrowDate: 1,
              dueDate: 1,
              overdueDays: {
                  $divide: [{ $subtract: [now, '$dueDate'] }, 1000 * 60 * 60 * 24]
              }
          }
      }
    ];

    const results = await loans.aggregate(pipeline).toArray();
    console.log('Overdue loans found:', results.length);
    if (results.length > 0) {
        console.log('First 3 overdue loans:', JSON.stringify(results.slice(0, 3), null, 2));
    } else {
        console.log('No overdue loans found based on logic.');
        // Debug: Show some active loans to see dates
        const activeLoans = await loans.aggregate([
            {
                $lookup: {
                    from: 'loandetails',
                    localField: '_id',
                    foreignField: 'loanId',
                    as: 'loanDetail',
                },
            },
            { $unwind: '$loanDetail' },
            { $match: { 'loanDetail.returnDate': null } },
            { $limit: 3 }
        ]).toArray();
        console.log('Sample active loans (not necessarily overdue):', JSON.stringify(activeLoans, null, 2));
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

main();
