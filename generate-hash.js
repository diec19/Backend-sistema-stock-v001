import bcrypt from 'bcryptjs';

async function generate() {
  console.log('admin:', await bcrypt.hash('admin123', 10));
  console.log('cajero:', await bcrypt.hash('cajero123', 10));
  console.log('maria:', await bcrypt.hash('maria123', 10));
}

generate();