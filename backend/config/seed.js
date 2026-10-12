const bcrypt = require('bcryptjs');
const { query, get, run } = require('./db');

const seedData = async () => {
  try {
    // Check if admin user already exists
    const existingAdmin = await get("SELECT * FROM users WHERE email = 'admin@hostelcare.demo'");
    if (existingAdmin) {
      console.log('Seed data already present, skipping...');
      return;
    }

    console.log('Seeding demo data for HOSTELCARE...');
    const salt = await bcrypt.genSalt(10);
    const adminPass = await bcrypt.hash('admin123', salt);
    const studentPass = await bcrypt.hash('student123', salt);
    const staffPass = await bcrypt.hash('staff123', salt);

    // 1. Seed SLA Configs
    await run("INSERT INTO sla_configs (priority, resolution_hours) VALUES ('LOW', 48)");
    await run("INSERT INTO sla_configs (priority, resolution_hours) VALUES ('MEDIUM', 24)");
    await run("INSERT INTO sla_configs (priority, resolution_hours) VALUES ('HIGH', 8)");
    await run("INSERT INTO sla_configs (priority, resolution_hours) VALUES ('EMERGENCY', 2)");

    // 2. Seed Admin
    const adminUser = await run(
      "INSERT INTO users (name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?)",
      ['Chief Warden (Admin)', 'admin@hostelcare.demo', adminPass, 'WARDEN_ADMIN', '+91 98765 00001']
    );

    // 3. Seed Students
    const s1User = await run(
      "INSERT INTO users (name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?)",
      ['Yash Sharma', 'student@hostelcare.demo', studentPass, 'STUDENT', '+91 98765 11111']
    );
    const student1 = await run(
      "INSERT INTO students (user_id, roll_number, hostel_block, room_number) VALUES (?, ?, ?, ?)",
      [s1User.id, '2024-CS-102', 'Block A', 'A-204']
    );

    const s2User = await run(
      "INSERT INTO users (name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?)",
      ['Ananya Verma', 'ananya@hostelcare.demo', studentPass, 'STUDENT', '+91 98765 22222']
    );
    const student2 = await run(
      "INSERT INTO students (user_id, roll_number, hostel_block, room_number) VALUES (?, ?, ?, ?)",
      [s2User.id, '2024-EC-054', 'Block B', 'B-105']
    );

    const s3User = await run(
      "INSERT INTO users (name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?)",
      ['Rahul Patel', 'rahul@hostelcare.demo', studentPass, 'STUDENT', '+91 98765 33333']
    );
    const student3 = await run(
      "INSERT INTO students (user_id, roll_number, hostel_block, room_number) VALUES (?, ?, ?, ?)",
      [s3User.id, '2023-ME-089', 'Block C', 'C-312']
    );

    // 4. Seed Maintenance Staff
    const st1User = await run(
      "INSERT INTO users (name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?)",
      ['Ravi Kumar', 'staff@hostelcare.demo', staffPass, 'MAINTENANCE_STAFF', '+91 98765 44444']
    );
    const staff1 = await run(
      "INSERT INTO maintenance_staff (user_id, staff_code, department, specialization, current_workload) VALUES (?, ?, ?, ?, ?)",
      [st1User.id, 'STF-PLM-01', 'Plumbing', 'Water Leakage & Pipe Repair', 0]
    );

    const st2User = await run(
      "INSERT INTO users (name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?)",
      ['Sunita Sharma', 'sunita@hostelcare.demo', staffPass, 'MAINTENANCE_STAFF', '+91 98765 55555']
    );
    const staff2 = await run(
      "INSERT INTO maintenance_staff (user_id, staff_code, department, specialization, current_workload) VALUES (?, ?, ?, ?, ?)",
      [st2User.id, 'STF-ELE-01', 'Electrical', 'Wiring, Lights & Switchboards', 2]
    );

    const st3User = await run(
      "INSERT INTO users (name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?)",
      ['Amit Singh', 'amit@hostelcare.demo', staffPass, 'MAINTENANCE_STAFF', '+91 98765 66666']
    );
    const staff3 = await run(
      "INSERT INTO maintenance_staff (user_id, staff_code, department, specialization, current_workload) VALUES (?, ?, ?, ?, ?)",
      [st3User.id, 'STF-FUR-01', 'Furniture', 'Chairs, Tables & Bed Frames', 5]
    );

    const st4User = await run(
      "INSERT INTO users (name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?)",
      ['Vikram Joshi', 'vikram@hostelcare.demo', staffPass, 'MAINTENANCE_STAFF', '+91 98765 77777']
    );
    const staff4 = await run(
      "INSERT INTO maintenance_staff (user_id, staff_code, department, specialization, current_workload) VALUES (?, ?, ?, ?, ?)",
      [st4User.id, 'STF-NET-01', 'Wi-Fi / Internet', 'Router & Access Point Troubleshooting', 1]
    );

    // Helper date generator
    const now = new Date();
    const hoursAgo = (h) => new Date(now.getTime() - h * 3600 * 1000).toISOString();
    const hoursAhead = (h) => new Date(now.getTime() + h * 3600 * 1000).toISOString();

    // 5. Seed Realistic Complaints
    // Complaint 1: Closed resolved complaint (Water leakage)
    const c1 = await run(
      `INSERT INTO complaints 
       (complaint_code, student_id, category, priority, description, room_number, hostel_block, status, assigned_staff_id, created_at, assigned_at, started_at, resolved_at, closed_at, sla_deadline)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'CMP-2026-00124',
        student1.id,
        'Plumbing',
        'HIGH',
        'Water is leaking continuously from the pipe under my bathroom sink.',
        'A-204',
        'Block A',
        'CLOSED',
        staff1.id,
        hoursAgo(24),
        hoursAgo(22),
        hoursAgo(20),
        hoursAgo(15),
        hoursAgo(10),
        hoursAgo(16)
      ]
    );

    await run(`INSERT INTO feedback (complaint_id, student_id, rating, comment, created_at) VALUES (?, ?, ?, ?, ?)`, [
      c1.id,
      student1.id,
      5,
      'Problem was resolved quickly and staff was very polite!',
      hoursAgo(10)
    ]);

    await run(
      `INSERT INTO complaint_history (complaint_id, old_status, new_status, changed_by, remarks, timestamp) VALUES (?, ?, ?, ?, ?, ?)`,
      [c1.id, 'SUBMITTED', 'PENDING', s1User.id, 'Complaint raised by student', hoursAgo(24)]
    );
    await run(
      `INSERT INTO complaint_history (complaint_id, old_status, new_status, changed_by, remarks, timestamp) VALUES (?, ?, ?, ?, ?, ?)`,
      [c1.id, 'PENDING', 'ASSIGNED', adminUser.id, 'Assigned to Ravi Kumar (Plumbing)', hoursAgo(22)]
    );
    await run(
      `INSERT INTO complaint_history (complaint_id, old_status, new_status, changed_by, remarks, timestamp) VALUES (?, ?, ?, ?, ?, ?)`,
      [c1.id, 'ASSIGNED', 'IN_PROGRESS', st1User.id, 'Staff started work on leak', hoursAgo(20)]
    );
    await run(
      `INSERT INTO complaint_history (complaint_id, old_status, new_status, changed_by, remarks, timestamp) VALUES (?, ?, ?, ?, ?, ?)`,
      [c1.id, 'IN_PROGRESS', 'RESOLVED', st1User.id, 'Damaged pipe connector replaced and leakage tested.', hoursAgo(15)]
    );
    await run(
      `INSERT INTO complaint_history (complaint_id, old_status, new_status, changed_by, remarks, timestamp) VALUES (?, ?, ?, ?, ?, ?)`,
      [c1.id, 'RESOLVED', 'CLOSED', s1User.id, 'Student verified resolution & submitted 5-star rating', hoursAgo(10)]
    );

    // Complaint 2: In progress (Electrical light issue)
    const c2 = await run(
      `INSERT INTO complaints 
       (complaint_code, student_id, category, priority, description, room_number, hostel_block, status, assigned_staff_id, created_at, assigned_at, started_at, sla_deadline)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'CMP-2026-00125',
        student1.id,
        'Electrical',
        'MEDIUM',
        'Main tube light flickering continuously and switch spark observed.',
        'A-204',
        'Block A',
        'IN_PROGRESS',
        staff2.id,
        hoursAgo(6),
        hoursAgo(4),
        hoursAgo(2),
        hoursAhead(18)
      ]
    );

    await run(
      `INSERT INTO complaint_history (complaint_id, old_status, new_status, changed_by, remarks, timestamp) VALUES (?, ?, ?, ?, ?, ?)`,
      [c2.id, 'SUBMITTED', 'PENDING', s1User.id, 'Complaint raised', hoursAgo(6)]
    );
    await run(
      `INSERT INTO complaint_history (complaint_id, old_status, new_status, changed_by, remarks, timestamp) VALUES (?, ?, ?, ?, ?, ?)`,
      [c2.id, 'PENDING', 'ASSIGNED', adminUser.id, 'Assigned to Sunita Sharma', hoursAgo(4)]
    );
    await run(
      `INSERT INTO complaint_history (complaint_id, old_status, new_status, changed_by, remarks, timestamp) VALUES (?, ?, ?, ?, ?, ?)`,
      [c2.id, 'ASSIGNED', 'IN_PROGRESS', st2User.id, 'Work started - replacing switchboard unit', hoursAgo(2)]
    );

    // Complaint 3: Follow-up requested (AC / Fan noise)
    const c3 = await run(
      `INSERT INTO complaints 
       (complaint_code, student_id, category, priority, description, room_number, hostel_block, status, assigned_staff_id, created_at, assigned_at, started_at, resolved_at, sla_deadline)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'CMP-2026-00126',
        student2.id,
        'AC / Fan',
        'HIGH',
        'Ceiling fan regulator burnt and fan stopped working.',
        'B-105',
        'Block B',
        'FOLLOW_UP_REQUESTED',
        staff2.id,
        hoursAgo(30),
        hoursAgo(28),
        hoursAgo(26),
        hoursAgo(12),
        hoursAgo(22)
      ]
    );

    await run(
      `INSERT INTO followup_requests (complaint_id, student_id, reason, status, created_at) VALUES (?, ?, ?, ?, ?)`,
      [c3.id, student2.id, 'The fan regulator was replaced, but now the fan is making loud screeching noise when turned on.', 'REQUESTED', hoursAgo(2)]
    );

    await run(
      `INSERT INTO complaint_history (complaint_id, old_status, new_status, changed_by, remarks, timestamp) VALUES (?, ?, ?, ?, ?, ?)`,
      [c3.id, 'RESOLVED', 'FOLLOW_UP_REQUESTED', s2User.id, 'Student requested follow-up: Fan screeching noise', hoursAgo(2)]
    );

    // Complaint 4: Emergency pending (Broken door lock)
    const c4 = await run(
      `INSERT INTO complaints 
       (complaint_code, student_id, category, priority, description, room_number, hostel_block, status, created_at, sla_deadline)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'CMP-2026-00127',
        student3.id,
        'Room Maintenance',
        'EMERGENCY',
        'Room door lock broken from outside; unable to lock room securely before exams.',
        'C-312',
        'Block C',
        'PENDING',
        hoursAgo(1),
        hoursAhead(1)
      ]
    );

    await run(
      `INSERT INTO complaint_history (complaint_id, old_status, new_status, changed_by, remarks, timestamp) VALUES (?, ?, ?, ?, ?, ?)`,
      [c4.id, 'SUBMITTED', 'PENDING', s3User.id, 'Emergency complaint submitted', hoursAgo(1)]
    );

    // Complaint 5: Wi-Fi connectivity issue
    const c5 = await run(
      `INSERT INTO complaints 
       (complaint_code, student_id, category, priority, description, room_number, hostel_block, status, assigned_staff_id, created_at, assigned_at, sla_deadline)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'CMP-2026-00128',
        student3.id,
        'Wi-Fi / Internet',
        'MEDIUM',
        'Block C 3rd floor access point keeps disconnecting every 5 minutes.',
        'C-312',
        'Block C',
        'ASSIGNED',
        staff4.id,
        hoursAgo(5),
        hoursAgo(3),
        hoursAhead(19)
      ]
    );

    // 6. Seed Direct Help Requests
    await run(
      `INSERT INTO direct_help_requests (student_id, department, staff_id, subject, message, room_number, status, created_at)
       VALUES (?, 'Plumbing', ?, 'How to use main bathroom sink stopcock valve?', 'I am not sure how to operate the new quarter-turn valve under the bathroom sink without damaging it. Could you please guide me?', 'A-204', 'PENDING', ?)`,
      [student1.id, staff1.id, hoursAgo(3)]
    );

    await run(
      `INSERT INTO direct_help_requests (student_id, department, staff_id, subject, message, room_number, status, created_at)
       VALUES (?, 'Electrical', ?, 'Clarification on study desk light timer switch', 'Hi Sunita maam, is the study lamp switch touch sensitive or push button? I do not want to force press it.', 'B-105', 'PENDING', ?)`,
      [student2.id, staff2.id, hoursAgo(1)]
    );

    // 7. Seed Notifications
    await run(
      `INSERT INTO notifications (user_id, complaint_id, message, notification_type, is_read, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
      [adminUser.id, c4.id, '🚨 EMERGENCY Complaint CMP-2026-00127 raised for Room C-312!', 'EMERGENCY', 0, hoursAgo(1)]
    );
    await run(
      `INSERT INTO notifications (user_id, complaint_id, message, notification_type, is_read, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
      [st2User.id, c3.id, '⚠️ Follow-up requested by student for CMP-2026-00126 (Room B-105)', 'WARNING', 0, hoursAgo(2)]
    );
    await run(
      `INSERT INTO notifications (user_id, complaint_id, message, notification_type, is_read, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
      [s1User.id, c2.id, '🔧 Work has started on your complaint CMP-2026-00125 by Sunita Sharma', 'INFO', 0, hoursAgo(2)]
    );

    console.log('Demo data seeded successfully!');
  } catch (error) {
    console.error('Error seeding demo data:', error);
  }
};

module.exports = seedData;
