const bcrypt = require('bcrypt');
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

// Jumlah 'salt rounds' (semakin tinggi, semakin aman tapi lambat)
const saltRounds = 10; 

readline.question('Masukkan password yang ingin di-hash: ', password => {
  if (!password) {
    console.error('Password tidak boleh kosong!');
    readline.close();
    return;
  }

  bcrypt.hash(password, saltRounds, (err, hash) => {
    if (err) {
      console.error('Error saat hashing password:', err);
    } else {
      console.log('Password asli:', password);
      console.log('Password hash:', hash);
      console.log('\nCopy hash di atas dan masukkan ke database.');
    }
    readline.close();
  });
});