import db from './modules/db/db'

document.addEventListener('DOMContentLoaded', function () {
  db.init();
  console.log('DOMContentLoaded');
});
